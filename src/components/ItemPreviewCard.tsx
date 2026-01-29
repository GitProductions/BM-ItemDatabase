import React from 'react'
import { Item } from '@/types/items'

function ItemPreviewCard({item}: {item: Item}) {
  return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-200 space-y-2">
            <div className="flex justify-between gap-3">
              <div className="font-semibold text-sm text-white">{item.name}</div>
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-400">
                {item.type}
              </span>
            </div>
            <div className="text-zinc-400">
              Keywords: <span className="text-zinc-200 font-mono">{item.keywords}</span>
            </div>
            {item.ego && (
              <div className="text-zinc-400">
                Ego: <span className="text-zinc-200">{item.ego}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {item.flags.map((flag) => (
                <span
                  key={flag}
                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 uppercase"
                >
                  {flag}
                </span>
              ))}
            </div>
            <div className="space-y-1">
              {item.stats?.damage && (
                <div className="text-zinc-400">
                  Damage: <span className="text-red-200 font-mono">{item.stats.damage}</span>
                </div>
              )}
              {typeof item.stats?.ac === 'number' && (
                <div className="text-zinc-400">
                  AC: <span className="text-blue-200 font-mono">{item.stats.ac}</span>
                </div>
              )}
              {typeof item.stats?.weight === 'number' && (
                <div className="text-zinc-400">
                  Weight: <span className="text-amber-200 font-mono">{item.stats.weight}</span>
                </div>
              )}
            </div>
            {item.stats?.affects?.length ? (
              <div className="space-y-1">
                <div className="text-[11px] uppercase text-zinc-500">Affects</div>
                <ul className="text-zinc-300 list-disc list-inside space-y-0.5">
                  {item.stats.affects.map((affect, idx) => (
                    <li key={idx} className="font-mono">
                      {affect.type === 'spell'
                        ? `Cast ${affect.spell ?? ''} (lvl ${affect.level ?? '?'})`
                        : `${affect.stat}: ${affect.value}`}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
  )
}

export default ItemPreviewCard;