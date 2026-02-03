import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { withCors } from '@/lib/items-api';

const ITEMS_TAG = 'items';

export async function POST() {
  await revalidateTag(ITEMS_TAG);
  return withCors(
    NextResponse.json(
      { cleared: true, message: 'Cache invalidated manually' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    ),
  );
}

// Use default (node) runtime so OpenNext can bundle with Cloudflare target.
