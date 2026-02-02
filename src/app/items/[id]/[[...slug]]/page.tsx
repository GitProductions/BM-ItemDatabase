import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';

import { searchItems } from '@/lib/d1';
import { ItemCard } from '@/components/item-card';
import { StatBadge } from '@/components/stat-badge';
import { canonicalizeSlots, guessSlot, normalizeWornSlots, slotLabel } from '@/lib/slots';
import CopyButton from '@/components/ui/CopyButton';
import Button from '@/components/ui/Button';
import { buildItemPath } from '@/lib/slug';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const fetchItem = cache(async (id: string) => {
  const items = await searchItems({ id });
  return items[0] ?? null;
});

const formatValueRange = (
  value?: number,
  min?: number,
  max?: number,
  { signed = false }: { signed?: boolean } = {},
): string => {
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
  const descParts = [
    item.type,
    item.keywords ? `Keywords: ${item.keywords}` : null,
    slotText ? `Slots: ${slotText}` : null,
  ].filter(Boolean);

  const description = descParts.join(' • ');

  return {
    title: `${item.name} | BlackMUD Item DB`,
    description: description || 'BlackMUD item details',
    openGraph: {
      title: `${item.name} | BlackMUD Item DB`,
      description: description || 'BlackMUD item details',
    },
  };
}

export default async function ItemPage({ params }: { params: Promise<RouteParams> }) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  const stats = item.stats ?? { affects: [], weight: 0 };
  const affects = stats.affects ?? [];
  const wornSlots = canonicalizeSlots(normalizeWornSlots(item.worn));
  const displaySlots = wornSlots.length
    ? wornSlots
    : (() => {
        const guess = guessSlot(item);
        return guess ? canonicalizeSlots([guess]) : [];
      })();

  const headerList = headers();
  const protocol = headerList.get('x-forwarded-proto') ?? 'https';
  const host = headerList.get('host');
  const origin = host ? `${protocol}://${host}` : '';
  const itemUrl = origin ? `${origin}${buildItemPath(item.id, item.keywords)}` : buildItemPath(item.id, item.keywords);

  const damageStats = stats.damage ? calculateDamage(stats.damage) : null;
  const contributors = item.contributors ?? [];
  const primarySubmitter = contributors[0] ?? item.submittedBy ?? 'Unknown';
  const extraSubmitters = contributors.slice(1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          Back to items
        </Link>
        <div className="flex items-center gap-2">
          <CopyButton value={itemUrl} />
          <Button
            as={Link}
            href={itemUrl}
            size="sm"
            variant="secondary"
            startIcon={<ExternalLink size={14} />}
            className="min-w-[96px]"
          >
            Open page
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300">Item</p>
            <h1 className="text-3xl font-bold text-white leading-tight">{item.name || 'Unnamed item'}</h1>
            <p className="text-sm text-zinc-400 font-mono">
              {item.keywords || 'No keywords'} • <span className="uppercase text-zinc-300">{item.type}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="text-[11px] text-zinc-500 font-mono">ID: {item.id}</span>
            <div className="flex flex-wrap gap-2 justify-end">
              {item.isArtifact && (
                <span className="text-[11px] uppercase bg-amber-900/40 border border-amber-700 px-2 py-1 rounded-md text-amber-200">
                  Artifact
                </span>
              )}
              {item.flaggedForReview && (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase bg-rose-900/40 border border-rose-700 px-2 py-1 rounded-md text-rose-200">
                  <AlertTriangle size={12} />
                  Needs review
                </span>
              )}
            </div>
          </div>
        </div>

        <ItemCard item={item} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Worn & Source</h2>
          <div className="flex flex-wrap gap-2">
            {displaySlots.length ? (
              displaySlots.map((slot) => (
                <span
                  key={slot}
                  className="text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 px-2 py-1 rounded-full"
                >
                  {slotLabel(slot)}
                </span>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Slot unknown</p>
            )}
          </div>
          {item.droppedBy ? (
            <p className="text-sm text-zinc-300">
              Dropped by: <span className="text-white">{item.droppedBy}</span>
            </p>
          ) : null}
          {item.duplicateOf ? (
            <p className="text-sm text-zinc-400">
              Possible duplicate of{' '}
              <Link href={buildItemPath(item.duplicateOf, undefined)} className="text-orange-300 hover:underline">
                {item.duplicateOf}
              </Link>
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Traits & Flags</h2>
          <div className="flex flex-wrap gap-2">
            {item.flags.length ? (
              item.flags.map((flag) => (
                <span
                  key={flag}
                  className="text-[11px] uppercase border border-zinc-700 text-zinc-200 px-2 py-1 rounded-md"
                >
                  {flag}
                </span>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No flags recorded.</p>
            )}
          </div>
          {item.ego ? <p className="text-sm text-zinc-300">Ego rating: {item.ego}</p> : null}
          <p className="text-sm text-zinc-400">
            Submissions logged: <span className="text-white">{item.submissionCount ?? '—'}</span>
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Contributors</h2>
          <p className="text-sm text-zinc-300">
            Primary: <span className="text-white">{primarySubmitter}</span>
          </p>
          {extraSubmitters.length ? (
            <div className="flex flex-wrap gap-2">
              {extraSubmitters.map((name) => (
                <span key={name} className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-1 rounded-full text-zinc-200">
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No additional contributors listed.</p>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Stats</h2>
          {damageStats ? (
            <p className="text-xs text-zinc-400 font-mono">
              Avg {damageStats.average} • Range {damageStats.low}–{damageStats.high}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {stats.weight !== undefined ? (
            <StatBadge
              label="Weight"
              value={formatValueRange(stats.weight, stats.weightMin, stats.weightMax)}
              color="bg-yellow-900/50 border border-yellow-800"
            />
          ) : null}
          {stats.ac !== undefined ? (
            <StatBadge
              label="AC"
              value={formatValueRange(stats.ac, stats.acMin, stats.acMax, { signed: true })}
              color="bg-blue-900/50 border border-blue-800"
            />
          ) : null}
          {stats.damage ? (
            <StatBadge label="Damage" value={stats.damage} color="bg-red-900/50 border border-red-800" />
          ) : null}
        </div>

        {affects.length ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {affects.map((affect, index) => (
              <li
                key={`${affect.type}-${index}`}
                className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-300"
              >
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase text-zinc-500">{affect.type}</span>
                  <span className="text-white">
                    {affect.type === 'spell' ? affect.spell : affect.stat}
                    {affect.level ? ` (lvl ${affect.level})` : ''}
                  </span>
                </div>
                <span className={(affect.max ?? affect.value ?? 0) >= 0 ? 'text-orange-300' : 'text-rose-300'}>
                  {formatValueRange(affect.value, affect.min, affect.max, { signed: true })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No affects recorded.</p>
        )}
      </section>

      {item.raw?.length ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-white">Identify dump</h2>
          <div className="rounded-lg border border-zinc-800 bg-black/50 p-3">
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-emerald-100">
              {item.raw.join('\n')}
            </pre>
          </div>
        </section>
      ) : null}
    </div>
  );
}
