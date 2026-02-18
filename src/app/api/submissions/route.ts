import { NextRequest, NextResponse } from 'next/server';
import { fetchRecentSubmissions } from '@/lib/d1';
import { withCors } from '@/lib/items-api';
import { parseSubmissionsQuery } from '@/lib/api-schema/submissions';
import { buildItemPath } from '@/lib/slug';

const submissionUrlFor = (request: NextRequest, itemId: string, submissionId: string) =>
  new URL(`/items/${itemId}/drops/${submissionId}`, request.url).toString();

const itemUrlFor = (request: NextRequest, itemId: string, keywords?: string | null) =>
  new URL(buildItemPath(itemId, keywords), request.url).toString();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = parseSubmissionsQuery(searchParams);
  if (!parsed.ok) {
    return withCors(NextResponse.json({ message: parsed.message }, { status: 400 }));
  }

  const limit = parsed.data.limit ?? 5;
  const submissions = await fetchRecentSubmissions(limit);

  const payload = submissions.map((submission) => {
    const keywords = submission.parsedItem?.keywords ?? null;
    return {
      ...submission,
      itemUrl: itemUrlFor(request, submission.itemId, keywords),
      submissionUrl: submissionUrlFor(request, submission.itemId, submission.submissionId),
    };
  });

  return withCors(
    NextResponse.json(
      { submissions: payload },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60',
          'Content-Type': 'application/json',
        },
      },
    ),
  );
}

export function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}
