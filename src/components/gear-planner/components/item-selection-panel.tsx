import React, { useMemo, useState } from 'react';
import { Search, RefreshCcw, X } from 'lucide-react';
import { Item } from '@/types/items';
import { SLOT_CONFIG } from '@/lib/slots';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { normalize } from '../util';
import { Selected, SlotKey } from '../types/types';

interface ItemSelectionPanelProps {
  activeSlot: SlotKey;
  slotGlyph: Record<SlotKey, string>;
  itemsBySlot: Record<SlotKey, Item[]>;
  candidateItems: Item[];
  selected: Selected;
  onSelect: (item: Item | null) => void;
  onReset: () => void;
}

const ItemSelectionPanel: React.FC<ItemSelectionPanelProps> = ({
  activeSlot,
  slotGlyph,
  itemsBySlot,
  candidateItems,
  selected,
  onSelect,
  onReset,
}) => {
  const [query, setQuery] = useState('');

  
  const slotLabel = useMemo(
    () => SLOT_CONFIG.find((s) => s.key === activeSlot)?.label ?? activeSlot,
    [activeSlot],
  );

  const filtered = useMemo(() => {
    const source = itemsBySlot[activeSlot] ?? candidateItems;
    const q = normalize(query.trim());
    if (!q) return source.slice(0, 40);
    return source
      .filter(
        (item) =>
          normalize(item.name).includes(q) ||
          normalize(item.keywords).includes(q) ||
          normalize(item.type).includes(q) ||
          normalize((item.worn ?? []).join(' ')).includes(q),
      )
      .slice(0, 60);
  }, [activeSlot, candidateItems, itemsBySlot, query]);

  const activeSelected = selected[activeSlot];

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-inner">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase text-zinc-500">Active Slot</div>
          <div className="text-lg font-semibold text-white flex items-center gap-2">
            {slotGlyph[activeSlot]} {slotLabel}
          </div>
          <div className="text-[11px] text-zinc-500">
            {itemsBySlot[activeSlot]?.length ?? candidateItems.length} items available
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeSelected ? (
            <Button size="sm" variant="secondary" onClick={() => onSelect(null)} className="text-xs rounded-md gap-1.5">
              <X size={14} /> Clear
            </Button>
          ) : null}
          {/* <Button size="sm" variant="ghost" onClick={onReset} className="text-xs text-orange-300 hover:text-orange-100 rounded-md gap-1.5">
            <RefreshCcw size={14} /> Reset
          </Button> */}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search item name, keyword, type"
          className="pl-10 pr-3 py-2 bg-zinc-900 border-zinc-800 text-sm"
        />
      </div>

      <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-lg">
            No items match this slot.
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                selected[activeSlot]?.id === item.id
                  ? 'border-orange-500 bg-orange-500/15 text-white'
                  : 'border-zinc-800 bg-zinc-950 hover:border-orange-500/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-white truncate">{item.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {item.keywords} • <span className="uppercase">{item.type}</span>
                  </div>
                  {item.worn && item.worn.length ? (
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-orange-200">
                      {item.worn.map((slot) => (
                        <span
                          key={slot}
                          className="rounded border border-orange-800/70 bg-orange-900/30 px-2 py-0.5 uppercase tracking-wide"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px] text-zinc-300">
                  {item.stats?.damage ? <span className="text-red-200">{item.stats.damage}</span> : null}
                  {item.stats?.ac !== undefined ? <span className="text-blue-200">AC {item.stats.ac}</span> : null}
                  <span className="text-amber-200">Wt {item.stats?.weight ?? 0}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ItemSelectionPanel;
