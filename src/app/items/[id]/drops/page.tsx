import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft } from 'lucide-react';

import { fetchItemVariants, searchItems } from '@/lib/d1';
import { ItemCard } from '@/components/item-card';
import { buildItemPath } from '@/lib/slug';

import { OriginalDropMeta, IdentifyDump, ItemHeaderBadges } from '@/components/item-details';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const fetchItem = cache(async (id: string) => {
  const items = await searchItems({ id });
  return items[0] ?? null;
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
        <div className="flex flex-col gap-2">
          <ItemHeaderBadges
            align="left"
            isArtifact={item.isArtifact}
            isMergedView
            flaggedForReview={item.flaggedForReview}
          />
          <h1 className="text-lg font-semibold text-white">Merged/Combined view</h1>
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
              

                {/* IsOriginal Badge & TimeStamp */}
                <OriginalDropMeta submittedAt={variant.submittedAt} submittedBy={variant.submittedBy} />

                {/* Link to individual drop view */}
                <div className="text-xs text-zinc-400">
                  <Link href={`/items/${id}/drops/${variant.submissionId}`} className="text-orange-300 hover:underline">
                    View this drop
                  </Link>
                </div>

                {/* If theres a parsedItem then we can show an item card */}
                {variant.parsedItem ? <ItemCard item={variant.parsedItem} /> : null}


                {/* If theres a raw dump then show it */}
                <IdentifyDump raw={variant.raw} collapsible />
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
