import { NextRequest, NextResponse } from 'next/server';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { deleteAllItems, searchItems, upsertItems } from '@/lib/d1';
import { ItemInput, normalizeItemInput, parseBooleanParam, withCors } from '@/lib/items-api';
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
  const owner = searchParams.get('owner')?.trim() || undefined;
  const flagged = parseBooleanParam(searchParams.get('flagged'));
  const id = searchParams.get('id')?.trim() || undefined;

  const limitParam = Number(searchParams.get('limit') ?? undefined);
  const offsetParam = Number(searchParams.get('offset') ?? undefined);

  const cacheKey = JSON.stringify({ q, type, owner, flagged, id, limit: limitParam, offset: offsetParam });
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
    owner,
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
  owner?: string;
  item?: ItemInput;
} & ItemInput;

export async function POST(request: NextRequest) {
  let payload: PostBody;

  try {
    payload = (await request.json()) as PostBody;
  } catch {
    return withCors(NextResponse.json({ message: 'Invalid request payload' }, { status: 400 }));
  }

  const ownerName = payload.owner?.trim();

  // 1) Raw identify dump -> multiple items
  const cleanedInput = payload?.raw?.trim();
  if (cleanedInput) {
    const parsedItems = parseIdentifyDump(cleanedInput);
    if (parsedItems.length) {
      await upsertItems(parsedItems, ownerName);
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

  await upsertItems([normalized.item], ownerName);
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

  await deleteAllItems();
  clearCache();
  return withCors(NextResponse.json({ deleted: true, items: [] }));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
