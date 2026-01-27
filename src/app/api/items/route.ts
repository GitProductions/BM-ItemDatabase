import { NextRequest, NextResponse } from 'next/server';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { getItemsCollection } from '@/lib/mongodb';

const fetchAllItems = async () => {
  const collection = await getItemsCollection();
  return collection.find().sort({ name: 1 }).toArray();
};

export async function GET() {
  const items = await fetchAllItems();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  let payload: { raw?: string };

  try {
    payload = (await request.json()) as { raw?: string };
  } catch {
    return NextResponse.json({ message: 'Invalid request payload' }, { status: 400 });
  }

  const cleanedInput = payload?.raw?.trim();
  if (!cleanedInput) {
    return NextResponse.json({ message: 'No identify data provided' }, { status: 400 });
  }

  const parsedItems = parseIdentifyDump(cleanedInput);
  if (!parsedItems.length) {
    const items = await fetchAllItems();
    return NextResponse.json({ items });
  }

  const collection = await getItemsCollection();
  const now = new Date();

  const operations = parsedItems.map((item) => ({
    updateOne: {
      filter: { keywords: item.keywords, name: item.name, type: item.type },
      update: {
        $set: {
          ...item,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      upsert: true,
    },
  }));

  await collection.bulkWrite(operations, { ordered: false });

  const items = await fetchAllItems();
  return NextResponse.json({ items });
}

export async function DELETE() {
  const collection = await getItemsCollection();
  await collection.deleteMany({});
  return NextResponse.json({ deleted: true, items: [] });
}