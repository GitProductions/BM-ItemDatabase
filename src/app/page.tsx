"use client";
import { useEffect, useMemo, useState } from 'react';
import { ItemDB } from '@/components/database-view';
import { ImportPanel } from '@/components/import-panel';
import { Item } from '@/types/items';
import { parseIdentifyDump, findDuplicate } from '@/lib/parse-identify-dump';
import Header from '@/components/header';
import Footer from '@/components/footer';

type AppView = 'db' | 'import';
type DuplicateCheckState = {
  hasDuplicates: boolean;
  duplicateItems: Item[];
  newItems: Item[];
};

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [view, setView] = useState<AppView>('db');
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckState | null>(null);

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
      setDuplicateCheck(null);
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

  const handleCheckDuplicates = () => {
    console.log('handleCheckDuplicates called', { previewItemsCount: previewItems.length, itemsCount: items.length });
    const duplicates: Item[] = [];
    const newItems: Item[] = [];

    previewItems.forEach((item) => {
      const duplicateId = findDuplicate(item, items);
      if (duplicateId) {
        duplicates.push({
          ...item,
          flaggedForReview: true,
          duplicateOf: duplicateId,
        });
      } else {
        newItems.push(item);
      }
    });

    console.log('Duplicate check result', { duplicatesCount: duplicates.length, newItemsCount: newItems.length });
    
    // If no duplicates found, proceed directly to import
    if (duplicates.length === 0) {
      console.log('No duplicates found, proceeding with import');
      handleImport();
      return;
    }
    
    setDuplicateCheck({
      hasDuplicates: true,
      duplicateItems: duplicates,
      newItems,
    });
  };

  const handleProceedWithDuplicates = async () => {
    if (!duplicateCheck) return;

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
      setDuplicateCheck(null);
      setView('db');
    } catch {
      setStatusMessage('Unable to save the identify data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelImport = () => {
    setDuplicateCheck(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-orange-500/30">


      <Header items={items} view={view} setView={setView} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 min-h-[80dvh]">
        {statusMessage && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-rose-400">
            {statusMessage}
          </div>
        )}

        {view === 'db' ? (
          loading ? (
            <div className="text-center py-20 text-zinc-500">Loading items from MongoDB...</div>
          ) : (
            <ItemDB items={items} />
          )
        ) : (
          <ImportPanel
            rawInput={rawInput}
            onRawInputChange={setRawInput}
            onCheckDuplicates={handleCheckDuplicates}
            onProceedWithDuplicates={handleProceedWithDuplicates}
            onCancelDuplicates={handleCancelImport}
            onClear={clearDb}
            isProcessing={isProcessing}
            previewItems={previewItems}
            userName={userName}
            onUserNameChange={setUserName}
            duplicateCheck={duplicateCheck}
          />
        )}


      </main>

      <Footer />
    </div>
  );
}
