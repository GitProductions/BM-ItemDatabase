import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/auth-store';
import { withCors } from '@/lib/items-api';
import { hashIp } from '@/lib/ip-hash';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; name?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    const password = body.password ?? '';

    if (!email || !name || password.length < 8) {
      return withCors(
        NextResponse.json(
          { message: 'Name, email, and a password of at least 8 characters are required.' },
          { status: 400 },
        ),
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return withCors(NextResponse.json({ message: 'That email is already registered.' }, { status: 409 }));
    }

    const ip = request.headers.get('x-real-ip') ?? '0.0.0.0';
    const ipHash = hashIp(ip);

    const user = await createUser({ email, name, password, lastIpHash: ipHash });
    return withCors(NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 }));
  } catch (error) {
    console.error('Register error', error);
    return withCors(NextResponse.json({ message: 'Unable to create account right now.' }, { status: 500 }));
  }
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
