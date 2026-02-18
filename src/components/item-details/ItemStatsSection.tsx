import { ItemAffect, ItemStats } from '@/types/items';

type DamageStats = { average: string; high: number; low: number };

type ItemStatsSectionProps = {
    stats: ItemStats;
    affects: ItemAffect[];
    damageStats?: DamageStats | null;
    formatValueRange: (value?: number, min?: number, max?: number, options?: { signed?: boolean }) => string;
};

export const ItemStatsSection = ({ stats, affects, damageStats, formatValueRange }: ItemStatsSectionProps) => (

    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">

        <div className="flex items-center justify-between gap-2">

            <h2 className="text-sm font-semibold text-white">Stats</h2>

            {/* Item Damage */}
            {damageStats ? (
                <p className="text-xs text-zinc-400 font-mono">
                    Avg {damageStats.average} • Range {damageStats.low}–{damageStats.high}
                </p>
            ) : null}

        </div>

        <div className="flex flex-wrap gap-2">
            {/* Item Weight */}
            {stats.weight !== undefined ? (
                <div className="inline-flex items-center gap-2 rounded-md border border-yellow-800 bg-yellow-900/50 px-2.5 py-1 text-xs text-yellow-100">
                    <span className="font-semibold">Weight</span>
                    <span>{formatValueRange(stats.weight, stats.weightMin, stats.weightMax)}</span>
                </div>
            ) : null}

            {/* Item AC */}
            {stats.ac !== undefined ? (
                <div className="inline-flex items-center gap-2 rounded-md border border-blue-800 bg-blue-900/50 px-2.5 py-1 text-xs text-blue-100">
                    <span className="font-semibold">AC</span>
                    <span>{formatValueRange(stats.ac, stats.acMin, stats.acMax, { signed: true })}</span>
                </div>
            ) : null}

            {/* Item Damage */}
            {stats.damage ? (
                <div className="inline-flex items-center gap-2 rounded-md border border-red-800 bg-red-900/50 px-2.5 py-1 text-xs text-red-100">
                    <span className="font-semibold">Damage</span>
                    <span>{stats.damage}</span>
                </div>
            ) : null}

        </div>
        
        {/* Item Affects List */}
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
);
