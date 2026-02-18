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
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Nav */}
      <div className="flex items-center justify-between gap-3">
        <Link href={mergedItemUrl} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          Back to item
        </Link>
        <span className="text-xs text-zinc-500 font-mono">ID: {item.id}</span>
      </div>

      {/* Page title */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-orange-300 mb-1">Item Drop List & Comparison</p>
        <h1 className="text-2xl font-bold text-white leading-tight">{item.name}</h1>

      </div>

      {/* Comparison grid — merged + all drops side by side */}
      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-3 min-w-0 items-stretch"
          style={{ gridTemplateColumns: `repeat(${variants.length + 1}, minmax(280px, 1fr))` }}
        >

          {/* Merged view — pinned first column */}
          <div className="flex flex-col gap-3 h-full">
            <div className="rounded-xl border border-orange-800/50 bg-zinc-900/70 p-4 space-y-3 flex flex-col h-full">
              <div className="flex flex-col gap-2">
                <ItemHeaderBadges
                  align="left"
                  isArtifact={item.isArtifact}
                  isMergedView
                  flaggedForReview={item.flaggedForReview}
                  hideBadges={true}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">Overall Stats</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Combined from all drops for possible min/max outcomes</p>
                </div>
              </div>
              <ItemCard item={item} />
            </div>
          </div>

          {/* Individual drops */}
          {variants.map((variant, i) => (
            <div key={variant.submissionId} className="flex flex-col gap-3 h-full">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3 flex flex-col h-full">

                {/* Drop header */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Drop #{i + 1}
                    </span>
                    <Link
                      href={`/items/${id}/drops/${variant.submissionId}`}
                      className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      View →
                    </Link>
                  </div>
                  <OriginalDropMeta submittedAt={variant.submittedAt} submittedBy={variant.submittedBy} />
                </div>

                {/* Item card */}
                {variant.parsedItem ? <ItemCard item={variant.parsedItem} /> : null}

                {/* Raw dump collapsible */}
                {/* <IdentifyDump raw={variant.raw} collapsible /> */}

              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Empty state */}
      {variants.length === 0 && (
        <p className="text-sm text-zinc-500">No original drops recorded yet.</p>
      )}

    </div>
  );
}