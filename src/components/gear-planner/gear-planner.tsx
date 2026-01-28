"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Item } from '@/types/items';
import { Sparkles } from 'lucide-react';
import Summary from './summary';
import ItemSelect from './item-select';
import { computeTotals } from './util';
import { SlotConfig, Selected, SlotKey, GearPlannerProps } from './types/types';

const SLOT_CONFIG: SlotConfig[] = [
  { key: 'head', label: 'Head', hint: 'helms, caps' },
  { key: 'neck1', label: 'Neck', hint: 'amulets, chains' },
  { key: 'neck2', label: 'Neck', hint: 'amulets, chains' },
  { key: 'body', label: 'Body', hint: 'robes, chestplates' },
  { key: 'about-legs', label: 'About Legs', hint: 'kilts, wraps' },
  { key: 'legs', label: 'Legs', hint: 'greaves, leggings' },
  { key: 'feet', label: 'Feet', hint: 'boots, shoes' },
  { key: 'hands', label: 'Hands', hint: 'gloves, gauntlets' },
  { key: 'waist', label: 'Waist', hint: 'belts, sashes' },
  { key: 'finger1', label: 'Ring', hint: 'rings, bands' },
  { key: 'finger2', label: 'Ring', hint: 'rings, bands' },
];

const defaultGearState: Selected = {
  head: null,
  neck1: null,
  neck2: null,
  body: null,
  'about-legs': null,
  legs: null,
  feet: null,
  hands: null,
  waist: null,
  finger1: null,
  finger2: null,
};

const defaultIdState: Record<SlotKey, string | null> = {
  head: null,
  neck1: null,
  neck2: null,
  body: null,
  'about-legs': null,
  legs: null,
  feet: null,
  hands: null,
  waist: null,
  finger1: null,
  finger2: null,
};

const STORAGE_KEY = 'bm-loadout';

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

  const selected: Selected = useMemo(() => {
    const mapped: Selected = { ...defaultGearState };
    (Object.keys(slotIds) as SlotKey[]).forEach((slot) => {
      const id = slotIds[slot];
      if (!id) {
        mapped[slot] = null;
        return;
      }
      mapped[slot] = items.find((item) => item.id === id) ?? null;
    });
    return mapped;
  }, [items, slotIds]);

  const totals = useMemo(() => computeTotals(selected), [selected]);

  // Persist loadout whenever selection changes
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
          <h2 className="text-xl font-bold text-white">Loadout & Stats</h2>
          <p className="text-sm text-zinc-400">
            Assign gear from the Item-DB and see a compact rollup of AC, damage, and weight.
          </p>
        </div>
      </div>

      <Summary totals={totals} reset={reset} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SLOT_CONFIG.map((slot) => (
          <ItemSelect
            key={slot.key}
            slot={slot}
            items={items}
            value={selected[slot.key]}
            onChange={handleChange(slot.key)}
          />
        ))}
      </div>
    </section>
  );
};
