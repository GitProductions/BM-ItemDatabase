import { NextRequest, NextResponse } from 'next/server';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { deleteAllItems, fetchItems, upsertItems } from '@/lib/d1';

export async function GET() {
  const items = await fetchItems();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let payload: { raw?: string; owner?: string };

  try {
    payload = (await request.json()) as { raw?: string; owner?: string };
  } catch {
    return NextResponse.json({ message: 'Invalid request payload' }, { status: 400 });
  }

  const cleanedInput = payload?.raw?.trim();
  if (!cleanedInput) {
    return NextResponse.json({ message: 'No identify data provided' }, { status: 400 });
  }

  const parsedItems = parseIdentifyDump(cleanedInput);
  if (!parsedItems.length) {
    const items = await fetchItems();
    return NextResponse.json({ items });
  }

  const ownerName = payload?.owner?.trim();

  await upsertItems(parsedItems, ownerName);

  const items = await fetchItems();
  return NextResponse.json({ items });
}

export async function DELETE() {
  await deleteAllItems();
  return NextResponse.json({ deleted: true, items: [] });
}
