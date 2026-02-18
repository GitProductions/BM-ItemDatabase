import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft } from 'lucide-react';

import { fetchItemVariants, searchItems } from '@/lib/d1';
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

type RouteParams = { id: string };

export default async function ItemDropsPage({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  const variants = (await fetchItemVariants(id)).filter((variant) => Boolean(variant.parsedItem));
  const mergedItemUrl = buildItemPath(item.id, item.keywords);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href={mergedItemUrl} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          Back to item
        </Link>
        <span className="text-xs text-zinc-500 font-mono">ID: {item.id}</span>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-white">Merged/Combined view</h1>
          <span className="text-[11px] uppercase bg-orange-900/40 border border-orange-700 px-2 py-1 rounded-md text-orange-200">
            Merged/Combined
          </span>
        </div>
        <ItemCard item={item} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Original drops</h2>
          <span className="text-xs text-zinc-500">{variants.length} recorded</span>
        </div>

        {variants.length ? (
          <div className="space-y-4">
            {variants.map((variant) => (
              <article key={variant.submissionId} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
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

                <div className="text-xs text-zinc-400">
                  <Link href={`/items/${id}/drops/${variant.submissionId}`} className="text-orange-300 hover:underline">
                    View this drop
                  </Link>
                </div>

                {variant.parsedItem ? <ItemCard item={variant.parsedItem} /> : null}

                {variant.raw?.length ? (
                  <details className="rounded-lg border border-zinc-800 bg-black/50 p-3 text-sm text-emerald-100">
                    <summary className="cursor-pointer text-xs text-zinc-400">Identify dump</summary>
                    <pre className="whitespace-pre-wrap font-mono leading-relaxed mt-2">
                      {variant.raw.join('\n')}
                    </pre>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No original drops recorded yet.</p>
        )}
      </section>
    </div>
  );
}
