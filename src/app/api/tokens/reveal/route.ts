import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { findUserByEmail, findUserById, getApiTokenForUser, revealPersonalToken } from '@/lib/auth-store';
import { withCors } from '@/lib/items-api';

const resolveSessionUser = async (session: Awaited<ReturnType<typeof getAuthSession>>) => {
  if (!session?.user) return null;
  const sessionId = session.user.id;
  const sessionEmail = session.user.email?.toLowerCase();

  const byId = sessionId ? await findUserById(sessionId) : null;
  if (byId) return byId;
  if (sessionEmail) {
    const byEmail = await findUserByEmail(sessionEmail);
    if (byEmail) return byEmail;
  }
  return null;
};

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return withCors(NextResponse.json({ message: 'Token id required' }, { status: 400 }));

  const userRecord = await resolveSessionUser(session);
  if (!userRecord) return withCors(NextResponse.json({ message: 'User not found' }, { status: 400 }));

  const tokenRecord = await getApiTokenForUser(userRecord.id, body.id);
  if (!tokenRecord || tokenRecord.revokedAt) {
    return withCors(NextResponse.json({ message: 'Token not found' }, { status: 404 }));
  }

  if (!tokenRecord.tokenEnc) {
    return withCors(
      NextResponse.json({ message: 'Token cannot be revealed. Please create a new token.' }, { status: 409 }),
    );
  }

  try {
    const token = revealPersonalToken(tokenRecord.tokenEnc);
    return withCors(NextResponse.json({ token }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reveal token';
    return withCors(NextResponse.json({ message }, { status: 400 }));
  }
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
