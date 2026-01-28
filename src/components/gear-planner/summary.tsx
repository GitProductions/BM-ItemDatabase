import React from 'react';
// import { Item } from '@/types/items';
import {  RefreshCcw, Sword } from 'lucide-react';

function Summary({totals, reset }: { totals: { totalAC: number; totalWeight: number; count: number; affectsTotals: Map<string, number>; damages: string[] }; reset: () => void;}) {
  return (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm uppercase text-zinc-400">Summary</h3>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCcw size={14} /> Reset
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-xs uppercase text-zinc-500">AC (base + affects)</p>
            <p className="text-2xl font-bold text-white">{totals.totalAC}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-xs uppercase text-zinc-500"> Weight </p>
            <p className="text-2xl font-bold text-white">{totals.totalWeight}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-xs uppercase text-zinc-500">Items Equipped</p>
            <p className="text-2xl font-bold text-white">{totals.count}</p>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-xs uppercase text-zinc-500 mb-2">Stat Affects (sum)</p>
            {totals.affectsTotals.size === 0 ? (
              <p className="text-xs text-zinc-500">No affects from equipped items.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {Array.from(totals.affectsTotals.entries()).map(([stat, value]) => (
                  <li key={stat} className="flex justify-between py-1 text-sm text-zinc-200">
                    <span className="capitalize">{stat}</span>
                    <span className={value >= 0 ? 'text-orange-300' : 'text-rose-300'}>
                      {value > 0 ? '+' : ''}
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-xs uppercase text-zinc-500 mb-2">Damage Sources</p>
            {totals.damages.length === 0 ? (
              <p className="text-xs text-zinc-500">No weapons selected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {totals.damages.map((dmg, idx) => (
                  <span
                    key={`${dmg}-${idx}`}
                    className="px-2 py-1 rounded bg-red-900/30 border border-red-800 text-red-200 text-xs flex items-center gap-1"
                  >
                    <Sword size={14} /> {dmg}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}

export default Summary