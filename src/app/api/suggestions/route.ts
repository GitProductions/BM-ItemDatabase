import { NextRequest, NextResponse } from 'next/server';
import { addSuggestion } from '@/lib/d1';
import { Suggestion } from '@/types/suggestions';

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { itemId?: string; note?: string; proposer?: string; reason?: string };
    const itemId = body.itemId?.trim();
    const note = body.note?.trim();
    const reason = body.reason?.trim();
    const proposer = body.proposer?.trim() || undefined;

    if (!itemId || !note) {
      return NextResponse.json({ message: 'itemId and note are required' }, { status: 400 });
    }

    const suggestion: Suggestion = {
      id: generateId(),
      itemId,
      proposer,
      note,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await addSuggestion(suggestion);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save suggestion', error);
    return NextResponse.json({ message: 'Failed to save suggestion' }, { status: 500 });
  }
}
