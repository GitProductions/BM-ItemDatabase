// app/mudlet/route.ts

import { NextResponse } from 'next/server';
import { withCors } from '@/lib/items-api'; 

const GITHUB_URL = process.env.GITHUB_RELEASE_URL || ''

export async function GET() {
  try {
    const response = await fetch(GITHUB_URL, {
      redirect: 'follow',
      cache: 'default',
    });

    if (!response.ok) {
      return withCors?.(
        NextResponse.json({ error: `Failed: ${response.status}` }, { status: response.status })
      ) ?? NextResponse.json({ error: `Failed: ${response.status}` }, { status: response.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', 'attachment; filename="BM-ITEMDB.mpackage"');
    headers.set('Cache-Control', 'public, max-age=86400');

    return withCors?.(
      new NextResponse(response.body, { status: 200, headers })
    ) ?? new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}