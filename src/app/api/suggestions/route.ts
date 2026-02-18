import { NextRequest, NextResponse } from 'next/server';
import { addSuggestion } from '@/lib/d1';
import { Suggestion } from '@/types/suggestions';
import { parseSuggestionBody } from '@/lib/api-schema/suggestions';
import { generateShortId } from '@/lib/id';


export async function POST(request: NextRequest) {
  try {
    const parsed = await parseSuggestionBody(request);
    if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: 400 });
    const { itemId, note, reason, proposer } = parsed.data;

    const suggestion: Suggestion = {
      id: generateShortId(8),
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
