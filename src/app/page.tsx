"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Database, Plus, Search } from 'lucide-react';
import { DatabaseView } from '@/components/database-view';
import { ImportPanel } from '@/components/import-panel';
import { Item } from '@/types/items';
import { parseIdentifyDump } from '@/lib/parse-identify-dump';
import Image from 'next/image';

type AppView = 'db' | 'import';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<AppView>('db');
  const [rawInput, setRawInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/items', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load items');
        const data = await response.json();
        setItems(data.items ?? []);
        setStatusMessage(null);
      } catch {
        setStatusMessage('Unable to load items from MongoDB. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const handleImport = async () => {
    if (!rawInput.trim()) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const trimmedUserName = userName.trim();
      const payload: { raw: string; owner?: string } = { raw: rawInput };
      if (trimmedUserName) payload.owner = trimmedUserName;
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Import failed');

      const data = await response.json();
      setItems(data.items ?? []);
      setRawInput('');
      setView('db');
    } catch {
      setStatusMessage('Unable to save the identify data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearDb = async () => {
    if (!confirm('Are you sure you want to clear the database?')) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/items', { method: 'DELETE' });
      if (!response.ok) throw new Error('Clear failed');
      setItems([]);
    } catch {
      setStatusMessage('Unable to clear the database. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const previewItems = useMemo(() => {
    if (!rawInput.trim()) return [];
    return parseIdentifyDump(rawInput);
  }, [rawInput]);

  const filteredItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return items.filter((item) => {
      const stats = item.stats ?? { affects: [], weight: 0 };
      const affects = stats.affects ?? [];
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.keywords.toLowerCase().includes(searchTerm) ||
        affects.some(
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className=" p-2 rounded text-white ">
     
              <Image className="shadow-lg shadow-orange-900/50" src="/bm-logo.png" alt="Logo" width={24} height={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">BlackMUD Item DB</h1>
              <p className="text-xs text-slate-400 font-mono">{items.length} artifacts indexed</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('db')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                view === 'db'
                  ? 'bg-slate-800 text-orange-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search size={16} /> Database
            </button>
            <button
              onClick={() => setView('import')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                view === 'import'
                  ? 'bg-slate-800 text-orange-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus size={16} /> Add Data
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {statusMessage && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-rose-400">
            {statusMessage}
          </div>
        )}

        {view === 'db' ? (
          loading ? (
            <div className="text-center py-20 text-slate-500">Loading artifacts from MongoDB...</div>
          ) : (
            <DatabaseView
              items={filteredItems}
              search={search}
              filterType={filterType}
              uniqueTypes={uniqueTypes}
              onSearchChange={setSearch}
              onFilterChange={setFilterType}
            />
          )
        ) : (
          <ImportPanel
            rawInput={rawInput}
            onRawInputChange={setRawInput}
            onImport={handleImport}
            onClear={clearDb}
            isProcessing={isProcessing}
            previewItems={previewItems}
            userName={userName}
            onUserNameChange={setUserName}
          />
        )}
      </main>
    </div>
  );
}
