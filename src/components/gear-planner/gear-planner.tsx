"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Item } from '@/types/items';
import { Sparkles } from 'lucide-react';
import Summary from './summary';
import ItemSelect from './item-select';
import { computeTotals } from './util';
import { Selected, SlotKey, GearPlannerProps } from './types/types';
import { SLOT_CONFIG, matchesSlot, slotMatchRank } from '@/lib/slots';


const defaultGearState: Selected = SLOT_CONFIG.reduce((acc, slot) => { {
  acc[slot.key] = null;
  return acc;
} }, {} as Selected);

const defaultIdState: Record<SlotKey, string | null> = SLOT_CONFIG.reduce((acc, slot) => { {
  acc[slot.key] = null;
  return acc;
} }, {} as Record<SlotKey, string | null>);


const STORAGE_KEY = 'bm-Equipment';

export const GearPlanner: React.FC<GearPlannerProps> = ({ items }) => {
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

  const itemsBySlot = useMemo(() => {
    const bySlot: Record<SlotKey, Item[]> = {} as Record<SlotKey, Item[]>;
    SLOT_CONFIG.forEach((slot) => {
      const sorted = [...candidateItems].sort((a, b) => {
        const rankA = slotMatchRank(a, slot.key);
        const rankB = slotMatchRank(b, slot.key);
        if (rankA !== rankB) return rankB - rankA; // higher rank first
        // fallback: keep broad inclusion behavior but stable-ish ordering
        const aMatch = matchesSlot(a, slot.key);
        const bMatch = matchesSlot(b, slot.key);
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      bySlot[slot.key] = sorted;
    });
    return bySlot;
  }, [candidateItems]);

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

  // Persist Equipment whenever selection changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slotIds));
  }, [slotIds]);

  const handleChange = (slot: SlotKey) => (item: Item | null) =>
    setSlotIds((prev) => ({ ...prev, [slot]: item?.id ?? null }));

  const reset = () => setSlotIds(defaultIdState);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="text-orange-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Equipment & Stats</h2>
          <p className="text-sm text-zinc-400">
            Assign gear from the Item-DB and see a compact rollup of AC, damage, and weight.
          </p>
        </div>
      </div>

      <Summary totals={totals} reset={reset} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
        {SLOT_CONFIG.map((slot) => (
          <ItemSelect
            key={slot.key}
            slot={slot}
            items={itemsBySlot[slot.key] ?? candidateItems}
            value={selected[slot.key]}
            onChange={handleChange(slot.key)}
          />
        ))}
      </div>
    </section>
  );
};
