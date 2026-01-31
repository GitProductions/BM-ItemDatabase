import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { updateUserIp } from '@/lib/auth-store';
import { hashIp } from '@/lib/ip-hash';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const ip = request.headers.get('x-real-ip') ?? '0.0.0.0';
  const ipHash = hashIp(ip);
  await updateUserIp(session.user.id, ipHash);

  return NextResponse.json({ ok: true });
}
