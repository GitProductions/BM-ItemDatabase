import { NextRequest, NextResponse } from 'next/server';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { deleteAllItems, deleteItem, searchItems, upsertItems } from '@/lib/d1';
import { ItemInput, normalizeItemInput, parseBooleanParam, withCors } from '@/lib/items-api';
import { Item } from '@/types/items';
import { clearCache, getCached, setCached } from '@/lib/memory-cache';

const isAuthorized = (request: NextRequest) => {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const secret = process.env.ADMIN_TOKEN;
  return Boolean(secret && token && token === secret);
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
  item?: ItemInput;
  items?: ItemInput[];
  overrides?: Record<string, Partial<ItemInput>>;
} & ItemInput;

export async function POST(request: NextRequest) {
  let payload: PostBody;

  try {
    payload = (await request.json()) as PostBody;
  } catch {
    return withCors(NextResponse.json({ message: 'Invalid request payload' }, { status: 400 }));
  }

  // 1) Client-supplied parsed items (keeps IDs/overrides intact)
  if (Array.isArray(payload.items) && payload.items.length) {
    const normalizedItems: Item[] = [];
    const submitter = payload.submittedBy?.trim();
    const overrides = payload.overrides ?? {};

    for (const incoming of payload.items) {
      const normalized = normalizeItemInput(incoming);
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
        droppedBy: override.droppedBy?.trim() ?? item.droppedBy?.trim(),
        worn: mergedWorn,
      });
    }

    await upsertItems(normalizedItems);
    clearCache();
    const items = await searchItems();
    return withCors(NextResponse.json({ items, inserted: normalizedItems.length }));
  }

  // 2) Raw identify dump -> multiple items (fallback path)
  const cleanedInput = payload?.raw?.trim();
  if (cleanedInput) {
    const submitter = payload.submittedBy?.trim();
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
          droppedBy: override.droppedBy?.trim() ?? item.droppedBy?.trim(),
          worn: mergedWorn,
        };
      });

      await upsertItems(merged);
      clearCache();
    }

    const items = await searchItems();
    return withCors(NextResponse.json({ items, inserted: parsedItems.length }));
  }

  // 2) Direct single-item submission
  const candidateItem = payload.item ?? payload;
  const normalized = normalizeItemInput(candidateItem);
  if (!normalized.ok) {
    return withCors(NextResponse.json({ message: normalized.message }, { status: 400 }));
  }

  await upsertItems([normalized.item]);
  clearCache();
  const [saved] = await searchItems({ id: normalized.item.id });

  return withCors(NextResponse.json({ item: saved ?? normalized.item }, { status: 201 }));
}

export async function DELETE(request: NextRequest) {
  // Require admin token to clear the database
  // Note: returning 401 rather than 403 to avoid leaking existence of the endpoint
  if (!isAuthorized(request)) {
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
