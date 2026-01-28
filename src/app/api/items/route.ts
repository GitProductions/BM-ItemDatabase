import { NextRequest, NextResponse } from 'next/server';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { deleteAllItems, searchItems, upsertItems } from '@/lib/d1';
import { ItemInput, normalizeItemInput, parseBooleanParam, withCors } from '@/lib/items-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || undefined;
  const type = searchParams.get('type')?.trim() || undefined;
  const owner = searchParams.get('owner')?.trim() || undefined;
  const flagged = parseBooleanParam(searchParams.get('flagged'));
  const id = searchParams.get('id')?.trim() || undefined;

  const limitParam = Number(searchParams.get('limit') ?? undefined);
  const offsetParam = Number(searchParams.get('offset') ?? undefined);

  const items = await searchItems({
    q,
    type,
    owner,
    flagged,
    id,
    limit: Number.isFinite(limitParam) ? limitParam : undefined,
    offset: Number.isFinite(offsetParam) ? offsetParam : undefined,
  });

  return withCors(NextResponse.json({ items, count: items.length }));
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
  const [saved] = await searchItems({ id: normalized.item.id });

  return withCors(NextResponse.json({ item: saved ?? normalized.item }, { status: 201 }));
}

export async function DELETE() {
  await deleteAllItems();
  return withCors(NextResponse.json({ deleted: true, items: [] }));
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
