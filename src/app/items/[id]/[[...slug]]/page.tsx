import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { ArrowLeft } from 'lucide-react';

import { fetchItemVariants, searchItems } from '@/lib/d1';
import { ItemCard } from '@/components/item-card';
import { canonicalizeSlots, guessSlot, normalizeWornSlots } from '@/lib/slots';
import CopyButton from '@/components/ui/CopyButton';
import { buildItemPath } from '@/lib/slug';
import { IdentifyDump, ItemWornSource, ItemTraitsFlags, ItemContributors, ItemStatsSection, RecentDropsList, ItemHeaderBadges } from '@/components/item-details';
import { slotLabel } from '@/lib/slots';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const fetchItem = cache(async (id: string) => {
  const items = await searchItems({ id });
  return items[0] ?? null;
});

const formatValueRange = (value?: number, min?: number, max?: number, { signed = false }: { signed?: boolean } = {}): string => {
  const fmt = (num?: number): string => {
    if (num === undefined || num === null) return '';
    const rounded = Number.isInteger(num) ? num.toString() : num.toFixed(1);
    if (!signed) return rounded;
    return num > 0 ? `+${rounded}` : rounded;
  };
  const fmin = fmt(min ?? value);
  const fmax = fmt(max ?? value);
  if (fmin && fmax && fmin !== fmax) return `${fmin} / ${fmax}`;
  if (fmin) return fmin;
  return value !== undefined ? fmt(value) : '';
};

type DamageStats = { average: string; high: number; low: number };
const calculateDamage = (damage: string): DamageStats | null => {
  const diceRegex = /(\d*)d(\d+)([+-]\d+)?/i;
  const match = damage.match(diceRegex);
  if (!match) return null;
  const numDice = parseInt(match[1]) || 1;
  const dieSides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  const averageDie = (dieSides + 1) / 2;
  const averageDamage = numDice * averageDie + modifier;

  const highDamage = numDice * dieSides + modifier;
  const lowDamage = numDice * 1 + modifier;
  return { average: averageDamage.toFixed(2), high: highDamage, low: lowDamage };
};



type RouteParams = { id: string; slug?: string[] };
export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) {
    return { title: 'Item not found | BlackMUD Item DB' };
  }

  const wornSlots = canonicalizeSlots(normalizeWornSlots(item.worn));
  const guessedSlots = wornSlots.length
    ? wornSlots
    : (() => {
      const guess = guessSlot(item);
      return guess ? canonicalizeSlots([guess]) : [];
    })();

  const slotText = guessedSlots.map((slot) => slotLabel(slot)).join(', ');
  // const descParts = [
  //   item.type,
  //   item.keywords ? `Keywords: ${item.keywords}` : null,
  //   slotText ? `Slots: ${slotText}` : null,
  // ].filter(Boolean);

  const description = "Learn more item details for " + item.name + (slotText ? ` worn on ${slotText}` : '');

  // if we create an image with all the details, people would be less likely to click through
  // const ogParams = new URLSearchParams({
  //   name: item.name,
  //   type: item.type,
  //   keywords: item.keywords ?? '',
  //   worn: slotText,
  //   damage: item.stats?.damage ?? '',
  //   ac: item.stats?.ac !== undefined ? String(item.stats.ac) : '',
  //   weight: item.stats?.weight !== undefined ? String(item.stats.weight) : '',
  //   ego: item.ego ?? '',
  //   droppedBy: item.droppedBy ?? '',
  //   artifact: item.isArtifact ? '1' : '',
  //   flags: item.flags?.join(',') ?? '',
  //   affects: JSON.stringify(
  //     (item.stats?.affects ?? []).map((affect) => ({
  //       type: affect.type,
  //       stat: affect.stat,
  //       value: affect.value,
  //       min: affect.min,
  //       max: affect.max,
  //       spell: affect.spell,
  //       level: affect.level,
  //     })),
  //   ),
  //   submittedBy: (item.contributors?.[0] ?? item.submittedBy ?? ''),
  // });
  // const metaOGImage = `/api/thumbnails/item?${ogParams.toString()}`;
  return {
    title: `${item.name} | BlackMUD Item DB`,
    description: description || 'BlackMUD item details',
    openGraph: {
      title: `${item.name} | BlackMUD Item DB`,
      description: description || 'BlackMUD item details',
      //   images: metaOGImage ? [
      //         {
      //           url: metaOGImage,
      //           alt: item.name,
      //         },
      //       ]
      //     : undefined,
      // },
      //  twitter: {
      //   card: 'summary_large_image',
      //   title: `${item.name} | BlackMUD Item DB`,
      //   description: description || 'BlackMUD item details',
      //   images: metaOGImage ? [
      //         {
      //           url: metaOGImage,
      //           alt: item.name,
      //         },
      //       ]
      //     : undefined,
    },
  };


}

export default async function ItemPage({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  const recentVariants = (await fetchItemVariants(id, 3)).filter((variant) => Boolean(variant.parsedItem));

  const stats = item.stats ?? { affects: [], weight: 0 };
  const affects = stats.affects ?? [];
  const wornSlots = canonicalizeSlots(normalizeWornSlots(item.worn));
  const displaySlots = wornSlots.length
    ? wornSlots
    : (() => {
      const guess = guessSlot(item);
      return guess ? canonicalizeSlots([guess]) : [];
    })();

  const itemUrl = buildItemPath(item.id, item.keywords);

  const damageStats = stats.damage ? calculateDamage(stats.damage) : null;
  const contributors = item.contributors ?? [];
  const primarySubmitter = contributors[0] ?? item.submittedBy ?? 'Unknown';
  const extraSubmitters = contributors.slice(1);
  const submissionCount = item.submissionCount ?? 0;
  const isMergedView = submissionCount > 1;
  const variantsHref = `/items/${item.id}/drops`;
  const shouldShowRecentDrops = submissionCount > 1 && recentVariants.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Item / Page Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          Back to items
        </Link>
        <div className="flex items-center gap-2">
          <CopyButton value={itemUrl} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300">Item</p>
            <h1 className="text-3xl font-bold text-white leading-tight">{item.name || 'Unnamed item'}</h1>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <span className="text-[11px] text-zinc-500 font-mono">ID: {item.id}</span>
           
            <ItemHeaderBadges
              isArtifact={item.isArtifact}
              isMergedView={isMergedView}
              flaggedForReview={item.flaggedForReview}
            />

          </div>
        </div>

        <ItemCard item={item} />

        
        {/* Recent Item Drop */}
        {shouldShowRecentDrops ? (
          <RecentDropsList
            itemId={id}
            recentVariants={recentVariants}
            submissionCount={submissionCount}
            variantsHref={variantsHref}
          />
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ItemWornSource displaySlots={displaySlots} droppedBy={item.droppedBy} duplicateOf={item.duplicateOf} />
        <ItemTraitsFlags flags={item.flags} ego={item.ego} egoMin={item.egoMin} egoMax={item.egoMax} />
        <ItemContributors primarySubmitter={primarySubmitter} extraSubmitters={extraSubmitters} />

      </div>


      {/* Bottom */}
      <ItemStatsSection
        stats={stats}
        affects={affects}
        damageStats={damageStats}
        formatValueRange={formatValueRange}
      />

      {/* If theres a raw dump then show it */}
      <IdentifyDump raw={item.raw} />
      
    </div>
  );
}
