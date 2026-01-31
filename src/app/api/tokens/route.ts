import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createApiToken, listApiTokens, revokeApiToken, findUserByEmail, findUserById } from '@/lib/auth-store';
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

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const userRecord = await resolveSessionUser(session);
  if (!userRecord) return withCors(NextResponse.json({ tokens: [] }));

  const tokens = await listApiTokens(userRecord.id);
  // Enforce single token contract on the API surface as well
  const token = tokens.at(0);
  return withCors(
    NextResponse.json({
      tokens: token
        ? [
            {
              id: token.id,
              label: token.label,
              createdAt: token.createdAt,
              lastUsedAt: token.lastUsedAt,
            },
          ]
        : [],
    }),
  );
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const body = (await request.json().catch(() => ({}))) as { label?: string };

  try {
    const userRecord = await resolveSessionUser(session);
    if (!userRecord) {
      throw new Error('Cannot create token: user not found');
    }

    const { token, record } = await createApiToken({ userId: userRecord.id, label: body.label });

    return withCors(
      NextResponse.json(
        {
          token,
          tokenId: record.id,
          createdAt: record.createdAt,
          label: record.label,
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create token';
    return withCors(NextResponse.json({ message }, { status: 400 }));
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return withCors(NextResponse.json({ message: 'Token id required' }, { status: 400 }));

  const userRecord = await resolveSessionUser(session);
  if (!userRecord) return withCors(NextResponse.json({ message: 'User not found' }, { status: 400 }));

  await revokeApiToken(userRecord.id, body.id);
  return withCors(NextResponse.json({ revoked: true }));
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
