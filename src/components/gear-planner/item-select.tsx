import React from 'react'
import { useMemo, useState, useRef } from 'react';
import { Item } from '@/types/items';
import { Sword, Shield, Weight } from 'lucide-react';
import SearchItem from './search-item';
import { normalize } from './util';


function ItemSelect({ slot, items, value, onChange }: { slot: { key: string; label: string; hint: string }; items: Item[]; value: Item | null; onChange: (item: Item | null) => void; }) {
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return items.slice(0, 12);
    return items
      .filter(
        (item) =>
          normalize(item.name).includes(q) ||
          normalize(item.keywords).includes(q) ||
          normalize(item.type).includes(q),
      )
      .slice(0, 12);
  }, [items, query]);



  return (
    <div ref={containerRef} className="relative rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate">{slot.label}</h3>
          </div>
        </div>
        {value ? (
          <button
            onClick={() => onChange(null)}
            className="text-[11px] text-rose-300 hover:text-rose-100 transition-colors"
          >
            Clear
          </button>
        ) : null}
      </div>

      <SearchItem
        query={query}
        setQuery={setQuery}
        filtered={filtered}
        onChange={(item) => {
          onChange(item);
        }}
        containerRef={containerRef}
      />

 

      {/* Equipped Item Stats Preview  */}
      {value ? (
        <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/70 p-2 text-xs text-zinc-200">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="font-semibold text-sm text-white truncate">{value.name}</div>
              <div className="text-[11px] text-zinc-500 truncate">
                {value.keywords} • <span className="uppercase">{value.type}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {value.stats?.damage ? (
                <span className="px-2 py-0.5 rounded bg-red-900/30 border border-red-800 text-red-200 flex items-center gap-1">
                  <Sword size={12} /> {value.stats.damage}
                </span>
              ) : null}
              {value.stats?.ac !== undefined ? (
                <span className="px-2 py-0.5 rounded bg-blue-900/30 border border-blue-800 text-blue-200 flex items-center gap-1">
                  <Shield size={12} /> {value.stats.ac}
                </span>
              ) : null}
              <span className="px-2 py-0.5 rounded bg-amber-900/20 border border-amber-800 text-amber-200 flex items-center gap-1">
                <Weight size={12} /> {value.stats?.weight ?? 0}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 rounded-md border border-dashed border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-500">
          Nothing equipped yet.
        </div>
      )}
    </div>
  );
};


export default ItemSelect