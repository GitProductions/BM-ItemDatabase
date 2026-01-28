import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/memory-cache';
import { withCors } from '@/lib/items-api';

export async function POST() {
  clearCache();
  return withCors(
    NextResponse.json(
      { cleared: true, message: 'Cache invalidated manually' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    ),
  );
}

// Use default (node) runtime so OpenNext can bundle with Cloudflare target.
