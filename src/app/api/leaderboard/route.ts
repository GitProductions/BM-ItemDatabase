import { NextRequest, NextResponse } from 'next/server';
import { fetchSubmitterLeaderboard } from '@/lib/d1';
import { withCors } from '@/lib/items-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit') ?? undefined);
  const limit = Number.isFinite(limitParam) ? limitParam : 20;

  const { entries, totals } = await fetchSubmitterLeaderboard(limit);

  return withCors(
    NextResponse.json(
      { submitters: entries, totals },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      },
    ),
  );
}
