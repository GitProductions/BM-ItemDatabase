"use client";
import React, { useMemo, useState } from 'react';
import { Database, Plus, Search } from 'lucide-react';
import { DatabaseView } from '@/components/database-view';
import { ImportPanel } from '@/components/import-panel';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import { Item } from '@/types/items';

type AppView = 'db' | 'import';

const SAMPLE_DATA = `
a heavy, black flail (excellent)..It hums powerfully
Object 'flail', Item type: weapon
This item's ego is of itty bitty proportions.
This item can only be repaired a limited number of times.
Times Repaired: 0   Repair Limit:   20
Item is: nodrop, hum, metal
Weight: 15
Damage Dice is '2D8'
Affects:
Type: hit-n-dam  Value: 3
a shining band crafted from lustrous metal (excellent)..It glows softly..It hums powerfully
Object 'band shining', Item type: armor
This item's ego is of tiny proportions.
This item can always be repaired.
Item is: glow, hum
Weight: 1
AC-apply is 6
Affects:
Type: spellfail  Value: 13
Type: hit-n-dam  Value: 1
Type:  mana  Value: 4
a black scroll (excellent)
Object 'scroll black', Item type: scroll
This item's ego is of itty bitty proportions.
This item cannot be repaired.
Item is: NOBITS 
Weight: 1
Affects:
Type: spell  Spell: sleep  Level: 23
Type: spell  Spell: curse  Level: 23
Type: spell  Spell: blindness  Level: 23
`;

export default function App() {
  const [items, setItems] = useState<Item[]>(() => parseIdentifyDump(SAMPLE_DATA));
  const [view, setView] = useState<AppView>('db');
  const [rawInput, setRawInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleImport = () => {
    const newItems = parseIdentifyDump(rawInput);
    setItems((previous) => [...newItems, ...previous]);
    setRawInput('');
    setView('db');
  };

  const clearDb = () => {
    if (confirm('Are you sure you want to clear the database?')) {
      setItems([]);
    }
  };

  const filteredItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.keywords.toLowerCase().includes(searchTerm) ||
        item.affects.some(
          (affect) =>
            affect.stat?.toLowerCase().includes(searchTerm) ||
            (affect.spell && affect.spell.toLowerCase().includes(searchTerm))
        );

      const matchesType = filterType === 'all' ? true : item.type.includes(filterType);

      return matchesSearch && matchesType;
    });
  }, [items, search, filterType]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map((item) => item.type));
    return ['all', ...Array.from(types)];
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded text-white shadow-lg shadow-emerald-900/50">
              <Database size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">MUD Identify DB</h1>
              <p className="text-xs text-slate-400 font-mono">{items.length} artifacts indexed</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('db')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                view === 'db'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search size={16} /> Database
            </button>
            <button
              onClick={() => setView('import')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                view === 'import'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus size={16} /> Add Data
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'db' ? (
          <DatabaseView
            items={filteredItems}
            search={search}
            filterType={filterType}
            uniqueTypes={uniqueTypes}
            onSearchChange={setSearch}
            onFilterChange={setFilterType}
          />
        ) : (
          <ImportPanel
            rawInput={rawInput}
            onRawInputChange={setRawInput}
            onImport={handleImport}
            onClear={clearDb}
          />
        )}
      </main>
    </div>
  );
}