import { ItemAffect, ItemStats } from '@/types/items';

type DamageStats = { average: string; high: number; low: number };

type ItemStatsSectionProps = {
    stats: ItemStats;
    affects: ItemAffect[];
    damageStats?: DamageStats | null;
    formatValueRange: (value?: number, min?: number, max?: number, options?: { signed?: boolean }) => string;
};

export const ItemStatsSection = ({ stats, affects, damageStats, formatValueRange }: ItemStatsSectionProps) => (

    <section className="card-section">

        <div className="flex items-center justify-between gap-2">

            <h2 className="text-sm font-semibold text-white">Stats</h2>

            {/* Item Damage */}
            {damageStats ? (
                <p className="text-xs text-zinc-200 font-mono">
                    Avg {damageStats.average} • Range {damageStats.low}–{damageStats.high}
                </p>
            ) : null}

        </div>

        <div className="flex flex-wrap gap-2">
            {/* Item Weight */}
            {stats.weight !== undefined ? (
                <div className="badge-base badge-stat-yellow">
                    <span className="font-semibold">Weight</span>
                    <span>{formatValueRange(stats.weight, stats.weightMin, stats.weightMax)}</span>
                </div>
            ) : null}

            {/* Item AC */}
            {stats.ac !== undefined ? (
                <div className="badge-base badge-stat-blue">
                    <span className="font-semibold">AC</span>
                    <span>{formatValueRange(stats.ac, stats.acMin, stats.acMax, { signed: true })}</span>
                </div>
            ) : null}

            {/* Item Damage */}
            {stats.damage ? (
                <div className="badge-base badge-stat-red">
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
                        className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-300"
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
