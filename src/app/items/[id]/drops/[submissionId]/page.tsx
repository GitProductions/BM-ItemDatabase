import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft } from 'lucide-react';

import { fetchItemVariant, searchItems } from '@/lib/d1';
import { ItemCard } from '@/components/item-card';
import { buildItemPath } from '@/lib/slug';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const fetchItem = cache(async (id: string) => {
  const items = await searchItems({ id });
  return items[0] ?? null;
});

const formatSubmittedAt = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });

type RouteParams = { id: string; submissionId: string };

export default async function ItemDropPage({ params }: { params: Promise<RouteParams> }) {
  const { id, submissionId } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  const variant = await fetchItemVariant(id, submissionId);
  if (!variant?.parsedItem) notFound();

  const mergedItemUrl = buildItemPath(item.id, item.keywords);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={mergedItemUrl} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          Back to merged view
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href={`/items/${id}/drops`} className="text-orange-300 hover:underline">
            All drops
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] uppercase bg-emerald-900/40 border border-emerald-700 px-2 py-1 rounded-md text-emerald-200">
            Original drop
          </span>
          <div className="text-xs text-zinc-400">
            <span className="text-zinc-200">{variant.submittedBy ?? 'Unknown'}</span>
            <span className="px-2 text-zinc-600">•</span>
            <span>{formatSubmittedAt(variant.submittedAt)}</span>
          </div>
        </div>

        <ItemCard item={variant.parsedItem} />

        {variant.raw?.length ? (
          <details className="rounded-lg border border-zinc-800 bg-black/50 p-3 text-sm text-emerald-100">
            <summary className="cursor-pointer text-xs text-zinc-400">Identify dump</summary>
            <pre className="whitespace-pre-wrap font-mono leading-relaxed mt-2">
              {variant.raw.join('\n')}
            </pre>
          </details>
        ) : null}
      </section>
    </div>
  );
}
