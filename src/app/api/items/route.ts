import { NextRequest, NextResponse } from 'next/server';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { deleteAllItems, deleteItem, searchItems, upsertItems } from '@/lib/d1';
import { ItemInput, normalizeItemInput, parseBooleanParam, withCors } from '@/lib/items-api';
import { Item } from '@/types/items';
import { clearCache, getCached, setCached } from '@/lib/memory-cache';
import { getAuthSession } from '@/lib/auth';
import { verifyApiToken } from '@/lib/auth-store';
import { hashIp } from '@/lib/ip-hash';
import { buildItemPath } from '@/lib/slug';

const itemUrlFor = (request: NextRequest, id: string, keywords?: string | null) =>
  new URL(buildItemPath(id, keywords), request.url).toString();

const getBearer = (request: NextRequest) => {
  const header = request.headers.get('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

const isAdminRequest = (request: NextRequest) => {
  const token = getBearer(request);
  const secret = process.env.ADMIN_TOKEN;
  return Boolean(secret && token && token === secret);
};

const resolveRequester = async (request: NextRequest) => {
  const bearer = getBearer(request);
  if (bearer) {
    if (isAdminRequest(request)) return { isAdmin: true };
    const apiUser = await verifyApiToken(bearer);
    if (apiUser) return { isAdmin: false, userId: apiUser.id, name: apiUser.name, email: apiUser.email };
  }

  const session = await getAuthSession();
  if (session?.user?.id) {
    return {
      isAdmin: false,
      userId: session.user.id,
      name: session.user.name ?? undefined,
      email: session.user.email ?? undefined,
    };
  }

  return null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || undefined;
  const type = searchParams.get('type')?.trim() || undefined;
  const flagged = parseBooleanParam(searchParams.get('flagged'));
  const id = searchParams.get('id')?.trim() || undefined;

  const limitParam = Number(searchParams.get('limit') ?? undefined);
  const offsetParam = Number(searchParams.get('offset') ?? undefined);

  const cacheKey = JSON.stringify({ q, type, flagged, id, limit: limitParam, offset: offsetParam });
  const cached = getCached<{ items: unknown[]; count: number }>(cacheKey);
  if (cached) {
    return withCors(
      NextResponse.json(cached, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'HIT',
        },
      }),
    );
  }

  const items = await searchItems({
    q,
    type,
    flagged,
    id,
    limit: Number.isFinite(limitParam) ? limitParam : undefined,
    offset: Number.isFinite(offsetParam) ? offsetParam : undefined,
  });

  const payload = { items, count: items.length };
  setCached(cacheKey, payload);

  return withCors(
    NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'MISS',
      },
    }),
  );
}

type PostBody = {
  raw?: string;
  submittedBy?: string;
  submittedByUserId?: string;
  item?: ItemInput;
  items?: ItemInput[];
  overrides?: Record<string, Partial<ItemInput>>;
} & ItemInput;

const applyRequester = (item: ItemInput, requester: Awaited<ReturnType<typeof resolveRequester>>): ItemInput => {
  if (!requester?.userId) return item;
  return {
    ...item,
    submittedByUserId: requester.userId,
    submittedBy: requester.name ?? item.submittedBy ?? requester.email ?? undefined,
  };
};

export async function POST(request: NextRequest) {
  const requester = await resolveRequester(request);
  if (!requester) {
    return withCors(
      NextResponse.json(
        {
          message: 'Authentication required: provide a valid API token in Authorization: Bearer <token> or sign in with a session',
        },
        { status: 401 },
      ),
    );
  }

  const ipHash = hashIp(request.headers.get('x-real-ip') ?? '0.0.0.0');
  let payload: PostBody;
  const toItemUrl = (id: string) => itemUrlFor(request, id);

  try {
    payload = (await request.json()) as PostBody;
  } catch {
    return withCors(NextResponse.json({ message: 'Invalid request payload' }, { status: 400 }));
  }

  // 1) Client-supplied parsed items (keeps IDs/overrides intact)
  if (Array.isArray(payload.items) && payload.items.length) {
    const normalizedItems: Item[] = [];
    const submitter = requester?.userId
      ? requester.name ?? payload.submittedBy?.trim() ?? requester.email ?? 'Unnamed'
      : payload.submittedBy?.trim();
    const overrides = payload.overrides ?? {};

    for (const incoming of payload.items) {
      const incomingWithSubmitter = applyRequester({ ...incoming, submittedBy: submitter ?? incoming.submittedBy }, requester);
      const normalized = normalizeItemInput(incomingWithSubmitter);
      if (!normalized.ok) {
        return withCors(NextResponse.json({ message: normalized.message }, { status: 400 }));
      }
      const item = normalized.item;
      const override = overrides[item.id] ?? {};
      const mergedWorn = (() => {
        const base = Array.isArray(item.worn) ? item.worn : [];
        const over = Array.isArray(override.worn) ? override.worn : typeof override.worn === 'string' ? [override.worn] : [];
        const combined = Array.from(new Set([...base, ...over].map((s) => s.trim().toLowerCase()).filter(Boolean)));
        return combined.length ? combined : undefined;
      })();

      normalizedItems.push({
        ...item,
        submittedBy: submitter ?? item.submittedBy,
        submittedByUserId: requester?.userId ?? item.submittedByUserId,
        droppedBy: override.droppedBy?.trim() ?? item.droppedBy?.trim(),
        worn: mergedWorn,
      });
    }

    const storedIds = await upsertItems(normalizedItems, { submissionIpHash: ipHash });
    clearCache();
    const items = await searchItems();
    const itemUrls = items
      .filter((item) => storedIds.includes(item.id))
      .map((item) => toItemUrl(item.id, item.keywords));
    return withCors(NextResponse.json({ items, inserted: normalizedItems.length, itemIds: storedIds, itemUrls }));
  }

  // 2) Raw identify dump -> multiple items (fallback path)
  const cleanedInput = payload?.raw?.trim();
  if (cleanedInput) {
    const submitter = requester?.userId
      ? requester.name ?? payload.submittedBy?.trim() ?? requester.email ?? 'Unnamed'
      : payload.submittedBy?.trim();
    const parsedItems = parseIdentifyDump(cleanedInput);
    if (parsedItems.length) {
      const overrides = payload.overrides ?? {};
      const merged = parsedItems.map((item) => {
        const override = overrides[item.id] ?? {};
        const mergedWorn = (() => {
          const base = Array.isArray(item.worn) ? item.worn : [];
          const over = Array.isArray(override.worn)
            ? override.worn
            : typeof override.worn === 'string'
              ? [override.worn]
              : [];
          const combined = Array.from(new Set([...base, ...over].map((s) => s.trim().toLowerCase()).filter(Boolean)));
          return combined.length ? combined : undefined;
        })();

        return {
          ...item,
          submittedBy: submitter ?? item.submittedBy,
          submittedByUserId: requester?.userId ?? item.submittedByUserId,
          droppedBy: override.droppedBy?.trim() ?? item.droppedBy?.trim(),
          worn: mergedWorn,
        };
      });

      const storedIds = await upsertItems(merged, { submissionIpHash: ipHash });
      clearCache();
      const items = await searchItems();
      const itemUrls = items
        .filter((item) => storedIds.includes(item.id))
        .map((item) => toItemUrl(item.id, item.keywords));
      return withCors(NextResponse.json({ items, inserted: parsedItems.length, itemIds: storedIds, itemUrls }));
    }

    const items = await searchItems();
    return withCors(NextResponse.json({ items, inserted: parsedItems.length, itemIds: [], itemUrls: [] }));
  }

  // 2) Direct single-item submission
  const candidateItem = applyRequester(payload.item ?? payload, requester);
  const normalized = normalizeItemInput(candidateItem);
  if (!normalized.ok) {
    return withCors(NextResponse.json({ message: normalized.message }, { status: 400 }));
  }

  const [storedId] = await upsertItems([normalized.item], { submissionIpHash: ipHash });
  clearCache();
  const stableId = storedId ?? normalized.item.id;
  const [saved] = await searchItems({ id: stableId });
  const itemUrl = stableId ? toItemUrl(stableId, saved?.keywords ?? normalized.item.keywords) : undefined;

  return withCors(
    NextResponse.json({ item: saved ?? normalized.item, itemId: stableId, itemUrl }, { status: 201 }),
  );
}

export async function PATCH(request: NextRequest) {
  // Only admins can directly overwrite items via the PATCH endpoint
  if (!isAdminRequest(request)) {
    return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));
  }

  let payload: { items?: ItemInput[]; item?: ItemInput } & ItemInput;

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return withCors(NextResponse.json({ message: 'Invalid request payload' }, { status: 400 }));
  }

  const incomingItems = payload.items ?? (payload.item ? [payload.item] : [payload]);
  const normalizedItems: Item[] = [];

  for (const incoming of incomingItems) {
    const normalized = normalizeItemInput(incoming);
    if (!normalized.ok) {
      return withCors(NextResponse.json({ message: normalized.message }, { status: 400 }));
    }
    normalizedItems.push(normalized.item);
  }

  const ipHash = hashIp(request.headers.get('x-real-ip') ?? '0.0.0.0');
  const updatedIds = await upsertItems(normalizedItems, { submissionIpHash: ipHash });
  clearCache();

  const savedId = normalizedItems.length === 1 ? updatedIds[0] ?? normalizedItems[0].id : null;
  const saved = savedId ? await searchItems({ id: savedId }) : null;
  const body =
    normalizedItems.length === 1
      ? {
          item: saved?.[0] ?? normalizedItems[0],
          itemId: savedId,
          itemUrl: savedId
            ? itemUrlFor(request, savedId, (saved?.[0] ?? normalizedItems[0])?.keywords)
            : undefined,
        }
      : {
          updated: normalizedItems.length,
          itemIds: updatedIds,
          itemUrls: updatedIds.map((id, idx) => itemUrlFor(request, id, normalizedItems[idx]?.keywords)),
        };

  return withCors(NextResponse.json(body, { status: 200 }));
}

export async function DELETE(request: NextRequest) {
  // Require admin token to clear the database
  // Note: returning 401 rather than 403 to avoid leaking existence of the endpoint
  if (!isAdminRequest(request)) {
    return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id')?.trim();

  if (id) {
    await deleteItem(id);
    clearCache();
    return withCors(NextResponse.json({ deleted: true, id }));
  }

  // If no id provided, fall back to full wipe (explicitly requested via ?all=true)
  const wipe = parseBooleanParam(searchParams.get('all'));
  if (wipe) {
    await deleteAllItems();
    clearCache();
    return withCors(NextResponse.json({ deleted: true, all: true, items: [] }));
  }

  return withCors(NextResponse.json({ message: 'id is required to delete an item (or set all=true to wipe)' }, { status: 400 }));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
