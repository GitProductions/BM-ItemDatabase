"use client";

import { useCallback, useMemo, useState } from 'react';
import { ImportPanel } from '@/components/import-panel';
import { Item } from '@/types/items';
import { parseIdentifyDump, findDuplicate } from '@/lib/parse-identify-dump';
import { useAppData } from '@/components/app-provider';

type DuplicateCheckState = {
  hasDuplicates: boolean;
  duplicateItems: Item[];
  newItems: Item[];
};

type ItemOverrides = Record<string, { name?: string; droppedBy?: string; worn?: string[] }>;

export default function AddItemPage() {
  const { items, refresh, userName } = useAppData();

  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckState | null>(null);
  const [itemOverrides, setItemOverrides] = useState<ItemOverrides>({});

  const previewItems = useMemo(() => {
    if (!rawInput.trim()) return [];
    return parseIdentifyDump(rawInput);
  }, [rawInput]);

  const areItemsIdentical = (a: Item, b: Item) => {
    const normalizeString = (v?: string) => (v ?? '').trim();
    const normalizeArray = (v?: unknown[]) => v ?? [];

    return (
      normalizeString(a.name) === normalizeString(b.name) &&
      normalizeString(a.keywords) === normalizeString(b.keywords) &&
      normalizeString(a.type) === normalizeString(b.type) &&
      normalizeString(a.ego) === normalizeString(b.ego) &&
      Boolean(a.isArtifact) === Boolean(b.isArtifact) &&
      JSON.stringify(normalizeArray(a.flags)) === JSON.stringify(normalizeArray(b.flags)) &&
      JSON.stringify(normalizeArray(a.worn)) === JSON.stringify(normalizeArray(b.worn)) &&
      JSON.stringify(a.stats ?? {}) === JSON.stringify(b.stats ?? {}) &&
      JSON.stringify(normalizeArray(a.raw)) === JSON.stringify(normalizeArray(b.raw))
    );
  };

  const handleOverrideChange = (id: string, overrides: { name?: string; droppedBy?: string; worn?: string[] }) => {
    setItemOverrides((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), ...overrides },
    }));
  };

  const buildPayloadItems = useCallback(
    (submitter?: string) =>
      previewItems.map((item) => {
        const override = itemOverrides[item.id] ?? {};
        const resolvedName = override.name?.trim() || item.name;
        const mergedWorn = (() => {
          const base = Array.isArray(item.worn) ? item.worn : [];
          const over = Array.isArray(override.worn)
            ? override.worn
            : typeof override.worn === 'string'
              ? [override.worn]
              : [];
          const combined = Array.from(new Set([...base, ...over].map((s) => s.trim().toLowerCase()).filter(Boolean)));
          return combined.length ? combined : undefined;
        })();
        return {
          ...item,
          name: resolvedName,
          submittedBy: submitter || item.submittedBy,
          droppedBy: override.droppedBy?.trim() ?? item.droppedBy,
          worn: mergedWorn,
        };
      }),
    [itemOverrides, previewItems],
  );

  const handleImport = useCallback(async () => {
    if (!rawInput.trim()) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const trimmedUserName = userName.trim();
      const mergedItems = buildPayloadItems(trimmedUserName);

      const payload: { items: typeof mergedItems; submittedBy?: string } = {
        items: mergedItems,
      };
      if (trimmedUserName) payload.submittedBy = trimmedUserName;

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Import failed');

      await refresh();
      setRawInput('');
      setItemOverrides({});
      setDuplicateCheck(null);
      localStorage.setItem('bm-database-userName', trimmedUserName);
    } catch (err) {
      console.error(err);
      setStatusMessage('Unable to save the identify data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [rawInput, userName, buildPayloadItems, refresh]);

  const handleCheckDuplicates = () => {
    const duplicates: Item[] = [];
    const newItems: Item[] = [];
    const candidates = buildPayloadItems();

    const missingNames = candidates.some((item) => !item.name?.trim());
    if (missingNames) {
      setStatusMessage('Please add a name for every item before importing.');
      return;
    }

    candidates.forEach((item) => {
      const duplicateId = findDuplicate(item, items);
      if (duplicateId) {
        const existing = items.find((i) => i.id === duplicateId);
        if (existing && areItemsIdentical(existing, item)) {
          return;
        }

        duplicates.push({
          ...item,
          flaggedForReview: true,
          duplicateOf: duplicateId,
        });
      } else {
        newItems.push(item);
      }
    });

    if (duplicates.length === 0) {
      void handleImport();
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
      const mergedItems = buildPayloadItems(trimmedUserName);

      const payload: { items: typeof mergedItems; submittedBy?: string } = { items: mergedItems };
      if (trimmedUserName) payload.submittedBy = trimmedUserName;

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Import failed');

      await refresh();
      setRawInput('');
      setItemOverrides({});
      setDuplicateCheck(null);
      localStorage.setItem('bm-database-userName', trimmedUserName);
    } catch (err) {
      console.error(err);
      setStatusMessage('Unable to save the identify data. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelImport = () => {
    setDuplicateCheck(null);
  };

  return (
    <>
      {statusMessage && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-rose-400">
          {statusMessage}
        </div>
      )}

      <ImportPanel
        rawInput={rawInput}
        onRawInputChange={setRawInput}
        onCheckDuplicates={handleCheckDuplicates}
        onProceedWithDuplicates={handleProceedWithDuplicates}
        onCancelDuplicates={handleCancelImport}
        isProcessing={isProcessing}
        previewItems={previewItems}
        // userName={userName}
        // onUserNameChange={setUserName}
        overrides={itemOverrides}
        onOverrideChange={handleOverrideChange}
        duplicateCheck={duplicateCheck}
      />
    </>
  );
}
