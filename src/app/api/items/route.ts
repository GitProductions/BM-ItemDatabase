import { NextRequest, NextResponse } from 'next/server';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { getItemsCollection } from '@/lib/mongodb';

export const dynamic = 'force-static';

const isMongoConfigured = Boolean(process.env.MONGODB_URI);
const staticModeMessage = 'MongoDB is not configured; running in static mode.';

const fetchAllItems = async () => {
  if (!isMongoConfigured) {
    return [];
  }

  const collection = await getItemsCollection();
  return collection.find().sort({ name: 1 }).toArray();
};

export async function GET() {
  if (!isMongoConfigured) {
    return NextResponse.json({ items: [], message: staticModeMessage });
  }

  const items = await fetchAllItems();
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
    const items = await fetchAllItems();
    return NextResponse.json({ items });
  }

  const ownerName = payload?.owner?.trim();

  if (!isMongoConfigured) {
    const staticResponse = parsedItems.map((item) => ({
      ...item,
      ...(ownerName ? { owner: ownerName } : {}),
    }));

    return NextResponse.json({
      items: staticResponse,
      message: 'MongoDB is not configured; imports are available only in this session.',
    });
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
          ...(ownerName ? { owner: ownerName } : {}),
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
  if (!isMongoConfigured) {
    return NextResponse.json({ deleted: true, items: [], message: staticModeMessage });
  }

  const collection = await getItemsCollection();
  await collection.deleteMany({});
  return NextResponse.json({ deleted: true, items: [] });
}