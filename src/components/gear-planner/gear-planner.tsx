"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Item } from '@/types/items';
import { Sparkles, RefreshCcw, X, Search } from 'lucide-react';
import Summary from './components/summary';
import { computeTotals } from './util';
import { Selected, SlotKey, GearPlannerProps } from './types/types';
import { SLOT_CONFIG, matchesSlot, slotMatchRank } from '@/lib/slots';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { normalize } from './util';
import Image from 'next/image';

const defaultGearState: Selected = SLOT_CONFIG.reduce((acc, slot) => {
  acc[slot.key] = null;
  return acc;
}, {} as Selected);

const defaultIdState: Record<SlotKey, string | null> = SLOT_CONFIG.reduce((acc, slot) => {
  acc[slot.key] = null;
  return acc;
}, {} as Record<SlotKey, string | null>);

const STORAGE_KEY = 'bm-Equipment';


// Designated Icons / Glyphs for Equipment Slots
const slotGlyph: Record<SlotKey, string> = {
  head: '🪖',
  neck1: '🧿',
  neck2: '🧿',
  body: '🥋',
  'about-legs': '🩳',
  legs: '🦵',
  feet: '🥾',
  hands: '🧤',
  arms: '🦾',
  waist: '🧷',
  finger1: '💍',
  finger2: '💍',
  wrist1: '📿',
  wrist2: '📿',
  wield: '⚔️',
  offhand: '🛡️',
  held: '📜',
  'two-handed': '🪓',
  back: '🎒',
  light: '💡',
  consumable: '🧪',
};

interface EquipmentSlotProps {
  slot: SlotKey;
  isActive: boolean;
  equipped: Item | null;
  onClick: () => void;
  variant?: 'default' | 'compact';
}

const EquipmentSlot: React.FC<EquipmentSlotProps> = ({ slot, isActive, equipped, onClick, variant = 'default' }) => {
  const slotConfig = SLOT_CONFIG.find((s) => s.key === slot);
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 rounded-lg border backdrop-blur-md transition
        ${variant === 'compact' ? 'py-1.5' : 'py-2'}
        ${isActive 
          ? 'border-orange-400 bg-orange-400/15 shadow-lg shadow-orange-900/40' 
          : 'border-zinc-700/70 bg-zinc-900/70 hover:border-orange-500/60'}
      `}
    >
      <div className="flex items-center gap-2 text-left">
        <div className={`${variant === 'compact' ? 'text-base' : 'text-lg'} shrink-0`}>
          {slotGlyph[slot] ?? '🎒'}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`${variant === 'compact' ? 'text-[10px]' : 'text-[11px]'} uppercase tracking-wide text-zinc-400`}>
            {slotConfig?.label}
          </div>
          <div className={`${variant === 'compact' ? 'text-xs' : 'text-sm'} font-semibold text-white truncate`}>
            {equipped ? equipped.name : 'Empty'}
          </div>
          {equipped && variant === 'default' ? (
            <div className="text-[10px] text-zinc-500 truncate">{equipped.keywords}</div>
          ) : null}
        </div>
      </div>
    </button>
  );
};

interface EquipmentGroupProps {
  title: string;
  slots: SlotKey[];
  columns?: number;
  activeSlot: SlotKey;
  selected: Selected;
  onSlotClick: (slot: SlotKey) => void;
  variant?: 'default' | 'compact';
}


//  Template for Item Selections / Groups
const EquipmentGroup: React.FC<EquipmentGroupProps> = ({  title,  slots,  columns = 1,  activeSlot,  selected,  onSlotClick, variant = 'default' }) => {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1">
        {title}
      </div>
      <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {slots.map((slot) => (
          <EquipmentSlot
            key={slot}
            slot={slot}
            isActive={activeSlot === slot}
            equipped={selected[slot]}
            onClick={() => onSlotClick(slot)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
};


// Main Gear Planner Component
export const GearPlanner: React.FC<GearPlannerProps> = ({ items }) => {
  const [activeSlot, setActiveSlot] = useState<SlotKey>('head');
  const [query, setQuery] = useState('');

  // State management for selected item IDs per slot
  const [slotIds, setSlotIds] = useState<Record<SlotKey, string | null>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return defaultIdState;
      const parsed = JSON.parse(saved) as Partial<Record<SlotKey, string | null>>;
      return { ...defaultIdState, ...parsed };
    } catch {
      return defaultIdState;
    }
  });

  const candidateItems = useMemo(() => items, [items]);

  // Items sorted by suitability for each slot
  const itemsBySlot = useMemo(() => {
    const bySlot: Record<SlotKey, Item[]> = {} as Record<SlotKey, Item[]>;
    SLOT_CONFIG.forEach((slot) => {
      const sorted = [...candidateItems].sort((a, b) => {
        const rankA = slotMatchRank(a, slot.key);
        const rankB = slotMatchRank(b, slot.key);
        if (rankA !== rankB) return rankB - rankA;
        const aMatch = matchesSlot(a, slot.key);
        const bMatch = matchesSlot(b, slot.key);
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      bySlot[slot.key] = sorted;
    });
    return bySlot;
  }, [candidateItems]);


  // Selected items mapped from IDs
  const selected: Selected = useMemo(() => {
    const mapped: Selected = { ...defaultGearState };
    (Object.keys(slotIds) as SlotKey[]).forEach((slot) => {
      const id = slotIds[slot];
      if (!id) {
        mapped[slot] = null;
        return;
      }
      mapped[slot] = candidateItems.find((item) => item.id === id) ?? null;
    });
    return mapped;
  }, [candidateItems, slotIds]);

  const totals = useMemo(() => computeTotals(selected), [selected]);

  // Save equipment selections to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slotIds));
  }, [slotIds]);

  // Handlers
  const handleChange = (slot: SlotKey) => (item: Item | null) =>
    setSlotIds((prev) => ({ ...prev, [slot]: item?.id ?? null }));

  const reset = () => setSlotIds(defaultIdState);

  const handleSlotClick = (slot: SlotKey) => {
    setActiveSlot(slot);
    setQuery('');
  };


  // Filtered items based on search query and active slot
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

  // Currently selected item for the active slot for our Item Selection Panel
  const activeSelected = selected[activeSlot];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="text-orange-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Equipment & Stats</h2>
          <p className="text-sm text-zinc-400">
            Assign gear from the Item-DB and see a compact rollup of AC, damage, item-stats, and weight.
          </p>
        </div>
      </div>

      <Summary totals={totals} reset={reset} />

      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl p-4">
        <div className="grid lg:grid-cols-[1.35fr,0.9fr] gap-6 items-start">


          {/* Image backdrop */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none opacity-[0.03]">
            <Image 
              src="/bm-logo.webp"
              alt="Background Logo"
              width={800}
              height={800}
              loading="eager"    
            />
          </div>

        
          {/* Equipment Layout Panel */}
          <div className="relative rounded-xl border border-zinc-800 bg-gradient-to-b from-orange-900/10 via-zinc-900/40 to-zinc-950/80 p-5 overflow-hidden">
                   
            {/* Responsive Grid Layout with Logical Grouping */}
            <div className="relative z-10 space-y-3">
              {/* Head & Accessories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <EquipmentGroup
                  title="Head"
                  slots={['head']}
                  activeSlot={activeSlot}
                  selected={selected}
                  onSlotClick={handleSlotClick}
                    variant="compact"
                />

                <EquipmentGroup
                  title="Back"
                  slots={['back']}
                  variant="compact"
                  activeSlot={activeSlot}
                  selected={selected}
                  onSlotClick={handleSlotClick}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-800/50" />

              {/* Main Body - Three Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side - Arms & Hands */}
                <div className="space-y-3">
                  <EquipmentGroup
                    title="Neck"
                    slots={['neck1', 'neck2']}
                    columns={1}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                  <EquipmentGroup
                    title="Arms"
                    slots={['arms']}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                
                </div>

                {/* Center Column - Torso, Legs, Waist, Feet */}
                <div className="space-y-3">
                  <EquipmentGroup
                    title="Body"
                    slots={['body']}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                  <EquipmentGroup
                    title="Waist"
                    slots={['waist']}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                  <EquipmentGroup
                    title="Legs"
                    slots={['about-legs', 'legs']}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                  <EquipmentGroup
                    title="Feet"
                    slots={['feet']}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                </div>

                {/* Right Side - Wrists, Hands, Fingers */}
                <div className="space-y-3">
                  <EquipmentGroup
                    title="Wrists"
                    slots={['wrist1', 'wrist2']}
                    columns={1}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />

                    <EquipmentGroup
                    title="Hands"
                    slots={['hands']}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                  <EquipmentGroup
                    title="Fingers"
                    slots={['finger1', 'finger2']}
                    columns={1}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    variant="compact"
                  />
                
                </div>
              </div>

              {/* Divider */}
              <div className=" border-t border-zinc-800/50" />


            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Weapons / Held Items */}
               <EquipmentGroup
                    title="Weapons"
                    slots={['wield', 'offhand', 'two-handed',]}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    columns={2}

                    variant="compact"
                  />
                  <EquipmentGroup
                    title="Held"
                    slots={['offhand', 'held', 'light']}
                    activeSlot={activeSlot}
                    selected={selected}
                    onSlotClick={handleSlotClick}
                    columns={2}
                    variant="compact"
                  />
                  </div>

              {/* Bottom Row - Consumable */}
              {/* <EquipmentGroup
                title="Consumable"
                slots={['consumable']}
                activeSlot={activeSlot}
                selected={selected}
                onSlotClick={handleSlotClick}
              /> */}
            </div>
          </div>


          {/* When an item is selected, populate Item Selection Panel */}
          {/* Perhaps we can make this show only when an item is hovered over or clicked on? */}



          {/* Item Selection Panel */}
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-inner">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-zinc-500">Active Slot</div>
                <div className="text-lg font-semibold text-white flex items-center gap-2">
                  {slotGlyph[activeSlot]} {SLOT_CONFIG.find((s) => s.key === activeSlot)?.label}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {itemsBySlot[activeSlot]?.length ?? candidateItems.length} items available
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeSelected ? (
                  <Button size="sm" variant="secondary" onClick={() => handleChange(activeSlot)(null)} className="text-xs">
                    <X size={14} /> Clear
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={reset} className="text-xs text-orange-300 hover:text-orange-100">
                  <RefreshCcw size={14} /> Reset
                </Button>
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
                    onClick={() => handleChange(activeSlot)(item)}
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


        </div>
      </div>
    </section>
  );
};