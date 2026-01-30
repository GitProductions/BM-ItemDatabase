import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { searchItems } from '@/lib/d1';
import { withCors } from '@/lib/items-api';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const items = await searchItems({ submittedByUserId: session.user.id, limit: 200 });
  return withCors(NextResponse.json({ items }));
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
