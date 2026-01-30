import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { updateUserName } from '@/lib/auth-store';
import { withCors } from '@/lib/items-api';


// API route to get or update the user's profile
export async function PATCH(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return withCors(NextResponse.json({ message: 'Display name must be at least 2 characters.' }, { status: 400 }));
  }

  try {
    const updated = await updateUserName(session.user.id, name);
    return withCors(NextResponse.json({ name: updated }));
  } catch (error) {
    console.error('Profile update failed', error);
    return withCors(NextResponse.json({ message: 'Unable to update profile.' }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
