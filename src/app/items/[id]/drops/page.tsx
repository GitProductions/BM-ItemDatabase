import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft } from 'lucide-react';

import { fetchItemVariants, searchItems } from '@/lib/d1';
import { ItemCard } from '@/components/item-card';
import { buildItemPath } from '@/lib/slug';
import DropsPagination from './_components/DropsPagination';
import { buildPageMetadata } from "@/lib/seo/metadata";

import { OriginalDropMeta, ItemHeaderBadges } from '@/components/item-details';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const fetchItem = cache(async (id: string) => {
  const items = await searchItems({ id });
  return items[0] ?? null;
});

type RouteParams = { id: string };

type SearchParams = Record<string, string | string[] | undefined>;

const toSingleParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const resolvePage = (rawPage: string | undefined, totalItems: number, pageSize: number) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const parsed = Number.parseInt(rawPage ?? '1', 10);
  const page = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), totalPages) : 1;
  const pageStart = (page - 1) * pageSize;

  return { page, totalPages, pageStart };
};


export const generateMetadata = async ({ params }: { params: Promise<RouteParams> }) => {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) {
    return { title: 'Item not found' };
  }

  
  return buildPageMetadata({
    title: `${item.name} Drops`,
    description: `Explore all original drops for ${item.name} submitted by the community, compare stats, and view raw data dumps.`,
    path: `/items/${id}/drops`,
    noindex: true, // we noindex this page since it's near duplicate content of the main item page and may cause SEO issues, but we still want it to be crawlable and followable for discovery so we do not set nofollow
    nofollow: false,
  });
}

export default async function ItemDropsPage({ params, searchParams}: { params: Promise<RouteParams>; searchParams?: Promise<SearchParams>}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const item = await fetchItem(id);
  if (!item) notFound();

  const variants = (await fetchItemVariants(id)).filter((variant) => Boolean(variant.parsedItem));
  const dropsPerPage = 6;
  const { page, totalPages, pageStart } = resolvePage(
    toSingleParam(resolvedSearchParams?.page),
    variants.length,
    dropsPerPage,
  );
  const pageVariants = variants.slice(pageStart, pageStart + dropsPerPage);
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300">Item Drop List & Comparison</p>
          <h1 className="text-3xl font-bold text-white leading-tight">{item.name || 'Unnamed item'}</h1>
        </div>
      </div>

      {/* Comparison grid - merged + all drops side by side */}
      <div className="pb-2">
        <div className="grid gap-3 min-w-0 items-stretch grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

          {/* Merged view - pinned first column */}
          <div className="flex flex-col gap-3 h-full">
            <div className="rounded-lg border border-orange-800/50 bg-zinc-900/70 p-4 space-y-3 flex flex-col h-full">
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
          {pageVariants.map((variant, i) => (
            <div key={variant.submissionId} className="flex flex-col gap-3 h-full">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 space-y-3 flex flex-col h-full">

                {/* Drop header */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Drop #{pageStart + i + 1}
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

      {totalPages > 1 && (
        <DropsPagination total={variants.length} pageSize={dropsPerPage} />
      )}

      {/* Empty state */}
      {variants.length === 0 && (
        <p className="text-sm text-zinc-500">No original drops recorded yet.</p>
      )}

    </div>
  );
}