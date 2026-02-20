import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { fetchUserSubmissions } from '@/lib/d1';
import { withCors } from '@/lib/items-api';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));
  }
  const userId = session.user.id;
  // Optionally support ?itemId=... to filter by item
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('itemId') || undefined;

  const submissions = await fetchUserSubmissions(userId, itemId);

  return withCors(
    NextResponse.json(
      { submissions },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60',
          'Content-Type': 'application/json',
        },
      },
    ),
  );
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
