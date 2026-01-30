import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createApiToken, listApiTokens, revokeApiToken } from '@/lib/auth-store';
import { withCors } from '@/lib/items-api';

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const tokens = await listApiTokens(session.user.id);
  return withCors(
    NextResponse.json({
      tokens: tokens.map((t) => ({
        id: t.id,
        label: t.label,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
      })),
    }),
  );
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const body = (await request.json().catch(() => ({}))) as { label?: string };
  const { token, record } = await createApiToken({ userId: session.user.id, label: body.label });

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
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) return withCors(NextResponse.json({ message: 'Unauthorized' }, { status: 401 }));

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return withCors(NextResponse.json({ message: 'Token id required' }, { status: 400 }));

  await revokeApiToken(session.user.id, body.id);
  return withCors(NextResponse.json({ revoked: true }));
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
