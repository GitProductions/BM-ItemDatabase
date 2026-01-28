"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Item } from '@/types/items';
import { Sparkles, RefreshCcw, Shield, Sword, Weight } from 'lucide-react';
import Summary from './summary';
import SearchItem from './search-item';
import ItemSelect from './item-select';
import { normalize, computeTotals } from './util';
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

export const GearPlanner: React.FC<GearPlannerProps> = ({ items }) => {
  const [selected, setSelected] = useState<Selected>(defaultGearState);

  const totals = useMemo(() => computeTotals(selected), [selected]);

  const reset = () => setSelected(defaultGearState);

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
            onChange={(item) => setSelected((prev) => ({ ...prev, [slot.key]: item }))}
          />
        ))}
      </div>


    </section>
  );
};
