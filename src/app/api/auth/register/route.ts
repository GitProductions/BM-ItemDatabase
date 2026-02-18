import { NextRequest, NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/auth-store';
import { withCors } from '@/lib/items-api';
import { hashIp } from '@/lib/ip-hash';
import { parseRegisterBody } from '@/lib/api-schema/auth';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseRegisterBody(request);
    if (!parsed.ok) {
      return withCors(
        NextResponse.json(
          { message: parsed.message },
          { status: 400 },
        ),
      );
    }
    const { email, name, password } = parsed.data;

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
