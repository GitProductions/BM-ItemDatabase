import React from 'react';
import { Database, Feather, Scroll, Shield, Sparkles, Sword } from 'lucide-react';
import { Item } from '@/types/items';
import { canonicalizeSlots, guessSlot, normalizeWornSlots, slotLabel } from '@/lib/slots';
import { StatBadge } from './stat-badge';
import Button from './ui/Button';

type ItemCardProps = {
  item: Item;
};

type DamageStats = {
  average: string;
  high: number;
  low: number;
};

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

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  let Icon = Database;
  let typeColor = 'text-zinc-400';

  const displayWorn = (() => {
    const slots = canonicalizeSlots(normalizeWornSlots(item.worn));

    // console.log('displayWorn slots:', slots);
    // console.log('item.worn:', item.worn);
    if (slots.length) return slots;
    const guessed = guessSlot(item);

    console.log('guessed slot:', guessed);
    return guessed ? canonicalizeSlots([guessed]) : [];
  })();
  const displayDroppedBy = item.droppedBy?.trim();


  console.log("ItemDroppedBy:", displayDroppedBy);

  const stats = item.stats ?? { affects: [], weight: 0 };
  const affects = stats.affects ?? [];

  if (item.type.includes('weapon')) {
    Icon = Sword;
    typeColor = 'text-red-400';
  } else if (item.type.includes('armor')) {
    Icon = Shield;
    typeColor = 'text-blue-400';
  } else if (item.type.includes('scroll') || item.type.includes('wand')) {
    Icon = Scroll;
    typeColor = 'text-purple-400';
  } else if (item.type.includes('light')) {
    Icon = Sparkles;
    typeColor = 'text-yellow-400';
  } else if (item.type.includes('worn')) {
    Icon = Feather;
    typeColor = 'text-green-400';
  }

  return (
    <div className="relative bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4 hover:border-zinc-500 transition-colors shadow-sm h-full">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-md bg-zinc-900 ${typeColor}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-md md:text-lg leading-tight">{item.name}</h3>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              {item.keywords} • <span className="uppercase text-zinc-400">{item.type}</span>
              {displayWorn.length ? (
                <>
                  {' '}
                  •{' '}
                  <span className="capitalize">
                    {displayWorn.map((slot) => slotLabel(slot)).join(', ')}
                  </span>
                </>
              ) : (
                ''
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          {item.isArtifact && (
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
              Artifact: Yes
            </span>
          )}
        </div>
      </div>

      <div className="mb-1">
        {item.ego && (
          <span className="text-[10px] uppercase border border-zinc-600 text-whte-400 px-1.5 py-0.5 rounded mr-1 mb-1 pt-1">
            Ego: {item.ego}
          </span>
        )}
      </div>

      <div className="mb-2">
        {item.flags.map((flag) => (
          <span
            key={flag}
            className="text-[10px] uppercase border border-zinc-600 text-zinc-400 px-1.5 py-0.5 rounded mr-1 mb-1 pt-1"
          >
            {flag}
          </span>
        ))}
      </div>

      <div className="mb-1 ">
        {stats.weight !== undefined && (
          <StatBadge
            label="Weight"
            value={formatValueRange(stats.weight, stats.weightMin, stats.weightMax)}
            color="bg-yellow-900/50 border border-yellow-800"
          />
        )}
        {stats.ac !== undefined && (
          <StatBadge
            label="AC"
            value={formatValueRange(stats.ac, stats.acMin, stats.acMax, { signed: true })}
            color="bg-blue-900/50 border border-blue-800"
          />
        )}
      </div>

      <div className="pb-1">
        {stats.damage && (
          <div className="relative group inline-block">
            <StatBadge label="Damage" value={stats.damage} color="bg-red-900/50 border border-red-800" />
            {(() => {
              const dmg = calculateDamage(stats.damage);
              return dmg ? (
                <div
                  className="absolute 
                    top-full left-[100%] -translate-x-1/2
                     mb-2 bg-zinc-950 border border-red-700 rounded px-3 py-2 
                     text-xs text-red-200 whitespace-nowrap 
                     opacity-0 group-hover:opacity-100 
                     transition-opacity pointer-events-none shadow-lg z-10"
                >
                  <div className="font-mono">
                    <div>
                      Avg: <span className="text-red-300 font-bold">{dmg.average}</span>
                    </div>
                    <div>
                      Low: <span className="text-red-300">{dmg.low}</span>
                    </div>
                    <div>
                      High: <span className="text-red-300">{dmg.high}</span>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {affects.length > 0 && (
        <div className="bg-zinc-900/50 rounded p-2 text-sm border-l-2 border-orange-600">
          <div className="text-[10px] uppercase text-zinc-500 mb-1 font-bold">Affects</div>
          <ul className="space-y-1">
            {affects.map((affect, index) => (
              <li key={`${affect.type}-${index}`} className="flex justify-between text-zinc-300 font-mono text-xs">
                {affect.type === 'spell' ? (
                  <>
                    <span>
                      Cast: <span className="text-purple-300">{affect.spell}</span>
                    </span>
                    <span>Lvl {affect.level}</span>
                  </>
                ) : (
                  <>
                    <span className="capitalize">{affect.stat}</span>
                    <span className={(affect.max ?? affect.value ?? 0) >= 0 ? 'text-orange-400' : 'text-red-400'}>
                      {formatValueRange(affect.value, affect.min, affect.max, { signed: true })}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
        <div className="flex justify-between gap-2">
          <div className="">
          <span>{displayWorn.length ? `Worn: ${displayWorn.map((slot) => slotLabel(slot)).join(', ')}` : ''}</span>
           {displayDroppedBy && 
           <p className="text-right italic">Dropped by: {displayDroppedBy}</p>
           }
           </div>
          <span className="flex items-center gap-2">
            <span>Submitted by:</span>
            {(() => {
              const names = item.contributors ?? [];
              const primary = names[0] ?? item.submittedBy;
              if (!primary) return <span>Unknown</span>;

              const extras = names.slice(1);

              return (
                <div className="relative group inline-flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{primary}</span>
                  {extras.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="text-[11px] text-zinc-400 underline-offset-2 hover:underline"
                      >
                        (+{extras.length} more)
                      </button>
                      <div className="absolute right-0 top-[120%] hidden group-hover:block bg-zinc-900 border border-zinc-700 rounded shadow-lg p-2 text-[11px] text-zinc-200 z-30 min-w-[160px]">
                        <div className="font-semibold text-orange-300 mb-1">Other submitters</div>
                        <ul className="space-y-0.5">
                          {extras.map((name) => (
                            <li key={name}>{name}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </span>
        </div>
       
      </div>
    </div>
  );
};
