import { NextRequest, NextResponse } from 'next/server';
import { fetchSubmitterLeaderboard } from '@/lib/d1';
import { withCors } from '@/lib/items-api';
import { parseLeaderboardQuery } from '@/lib/api-schema/leaderboard';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = parseLeaderboardQuery(searchParams);
  if (!parsed.ok) {
    return withCors(NextResponse.json({ message: parsed.message }, { status: 400 }));
  }

  const limit = parsed.data.limit ?? 20;

  const { entries, totals } = await fetchSubmitterLeaderboard(limit);

  return withCors(
    NextResponse.json(
      { submitters: entries, totals },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=86400', // 24 hours
        },
      },
    ),
  );
}
