
import React from 'react';
import Image from 'next/image';
import { Save, Terminal, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { ItemCard } from './item-card';
import ComboBox from './ui/comboBox';
import Input from './ui/Input';
import Button from './ui/Button';
import TextArea from './ui/TextArea';

import { Item } from '@/types/items';
import { SLOT_OPTIONS, guessSlot } from '@/lib/slots';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';
import { useAppData } from '@/components/app-provider';

type ImportPanelProps = {
  rawInput: string;
  onRawInputChange: (value: string) => void;
  onCheckDuplicates: () => void;
  onProceedWithDuplicates: () => void;
  onCancelDuplicates: () => void;
  isProcessing?: boolean;
  previewItems: Item[];
  // userName: string;
  // onUserNameChange: (value: string) => void;
  onOverrideChange: (id: string, overrides: { droppedBy?: string; worn?: string[] }) => void;
  overrides: Record<string, { droppedBy?: string; worn?: string[] }>;
  duplicateCheck?: {
    hasDuplicates: boolean;
    duplicateItems: Item[];
    newItems: Item[];
  } | null;
};


export const ImportPanel: React.FC<ImportPanelProps> = ({
  rawInput,
  onRawInputChange,
  onCheckDuplicates,
  onProceedWithDuplicates,
  onCancelDuplicates,
  isProcessing = false,
  previewItems,
  // userName,
  // onUserNameChange,
  onOverrideChange,
  overrides = {},
  duplicateCheck,
}) => {
  const { userName, handleSetUserName } = useAppData();

  // If there are duplicates, show the duplicate review panel
  if (duplicateCheck && duplicateCheck.hasDuplicates) {
    return (
      <div className="">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-lg">
          
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-amber-500" />
            <h2 className="text-lg font-bold text-white">Duplicate Items Detected</h2>
          </div>

          <div className="bg-amber-900/20 rounded-lg p-4 mb-6 border border-amber-900/50">
            <p className="text-sm text-amber-100 mb-2">
              <span className="font-semibold">{duplicateCheck.duplicateItems.length}</span> item(s) already exist in the database.
            </p>
            <p className="text-xs text-amber-200">
              These items will be flagged for manual review. You can proceed with the import, or cancel to adjust your data.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="space-y-3">
              <h3 className="text-sm uppercase tracking-wide text-green-400 font-semibold flex items-center gap-2">
                <CheckCircle size={16} /> New Items ({duplicateCheck.newItems.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-2">
                {duplicateCheck.newItems.length > 0 ? (
                  duplicateCheck.newItems.map((item) => <ItemCard key={item.id} item={item} />)
                ) : (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-500">
                    No new items found.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm uppercase tracking-wide text-amber-400 font-semibold flex items-center gap-2">
                <AlertCircle size={16} /> Duplicates ({duplicateCheck.duplicateItems.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px] pr-2">
                {duplicateCheck.duplicateItems.map((item) => (
                  <div key={item.id} className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3">
                    <ItemCard item={item} />
                    <div className="mt-2 text-xs text-amber-200 bg-amber-900/20 rounded px-2 py-1">
                      Marked for manual review
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <Button
              onClick={onCancelDuplicates}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              onClick={onProceedWithDuplicates}
              disabled={isProcessing}
              className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-lg shadow-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} /> Proceed with Import
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the main import panel
  return (
    <div className="">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Terminal className="text-orange-500" />
        <h2 className="text-lg font-bold text-white">Import Identify Data</h2>
      </div>

      {/* Tips/Notes */}
      <div className="bg-zinc-950/50 rounded-lg p-2 mb-4 border border-zinc-800 text-sm text-zinc-400">
        <p className="flex gap-2 items-center mb-1"> <Info  /> Paste your identify item output directly from the MUD or your doc file below. </p>
        <p className="mb-1">Enchanted items are stripped of their enchantments during import to maintain database consistency. </p>
      </div>

      {/* Username & submission */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.95fr]">

        {/* Username & submission */}
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="import-username" className="text-sm font-semibold text-zinc-200">
              User Name
            </label>
            <Input
              id="import-username"
              type="text"
              value={userName}
              onChange={(event) => handleSetUserName(event.target.value)}
              placeholder="e.g. Jaela, Merchants Guild"
              // size="sm"
            />
            <p className="text-[11px] text-zinc-500">Assigning a name gives you a way to edit this entry later & you get street cred...</p>
          </div>

          <TextArea
            value={rawInput}
            onChange={(event) => onRawInputChange(event.target.value)}
            spellCheck={false}
            placeholder="Paste content here (e.g. 'a heavy, black flail (excellent)...')"
            // className="w-full h-64 bg-zinc-950 border border-zinc-700 rounded-lg p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />

          <div className="flex justify-between items-center">
            <Button
              onClick={onCheckDuplicates}
              disabled={isProcessing || !rawInput.trim()}
              className="px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors shadow-lg shadow-orange-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} /> Check & Import
            </Button>
          </div>
        </div>


        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-wide text-zinc-400">Preview</h3>
            <p className="text-[11px] text-zinc-500">Review & Confirm the submitted items</p>
          </div>

          {/* Preview Items */}
          {previewItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[500px] pr-1">
              {previewItems.map((item) => {
                const override = overrides[item.id] ?? {};
                const guessedSlot = guessSlot(item);
                const selectedWorn = override.worn ?? item.worn ?? (guessedSlot ? [guessedSlot] : []);
                return (
                  <div key={item.id} className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/60 flex flex-col gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                      <label className="flex flex-col text-xs text-zinc-400">
                        <span className="mb-1">Dropped by</span>
                        <Input
                          type="text"
                          value={override.droppedBy ?? item.droppedBy ?? ''}
                          onChange={(e) => onOverrideChange(item.id, { droppedBy: e.target.value })}
                          placeholder="mob name"
                          // size="sm"
                        />
                      </label>
                      <label className="flex flex-col text-xs text-zinc-400">
                        <span className="mb-1">Worn slot(s)</span>
    
                        <ComboBox
                          options={SLOT_OPTIONS.map((slot) => slot.key)}
                          value={selectedWorn}
                          onChange={(selected) =>
                            onOverrideChange(item.id, {
                              worn: selected,
                            })
                          }
                          placeholder="Select or type worn slots"
                          size="sm"
                        />

                        {/* <span className="mt-1 text-[10px] text-zinc-500">Hold Ctrl (Cmd on Mac) to select multiple slots.</span> */}
                      </label>
                    </div>
                    <ItemCard
                      item={{
                        ...item,
                        submittedBy: userName,
                        droppedBy: override.droppedBy ?? item.droppedBy,
                        worn: override.worn ?? item.worn,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-500">

          <div className="text-center py-20 text-zinc-600">
            <Image src="/no-results.png" alt="No Results" width={200} height={200} className="mx-auto mb-4" />
            <p className="text-sm">
              {getRandomOrcPhrase('noIdentifyInfo', 'random')}
            </p>
          </div>
            </div>
          )}
        </div>
      </div>


    </div>
  </div>
);
};
          
