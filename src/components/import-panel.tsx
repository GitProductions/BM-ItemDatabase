import React from 'react';
import { Save, Terminal, Trash2 } from 'lucide-react';
import { ItemCard } from './item-card';
import { Item } from '@/types/items';

type ImportPanelProps = {
  rawInput: string;
  onRawInputChange: (value: string) => void;
  onImport: () => void;
  onClear: () => void;
  isProcessing?: boolean;
  previewItems: Item[];
};

export const ImportPanel: React.FC<ImportPanelProps> = ({
  rawInput,
  onRawInputChange,
  onImport,
  onClear,
  isProcessing = false,
  previewItems,
}) => (
  <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg">
    <div className="flex items-center gap-3 mb-6">
      <Terminal className="text-emerald-500" />
      <h2 className="text-lg font-bold text-white">Import Identify Data</h2>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Input Area */}
      <div className="flex flex-col">
        <div className="bg-slate-950/50 rounded-lg p-4 mb-4 border border-slate-800 text-sm text-slate-400">
          <p className="mb-2">Paste your text directly from the MUD client or your doc file below. The parser handles:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-slate-500 font-mono text-xs">
            <li>Full &apos;Identify&apos; output blocks</li>
            <li>Multiple items at once</li>
            <li>Stats, flags, weights, and affects</li>
          </ul>
        </div>

        <textarea
          value={rawInput}
          onChange={(event) => onRawInputChange(event.target.value)}
          placeholder="Paste content here (e.g. 'a heavy, black flail (excellent)...')"
          className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-4 min-h-[400px]"
        />

        <div className="flex justify-between items-center gap-3">
          <button
            onClick={onClear}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:text-slate-500"
          >
            <Trash2 size={16} /> Clear Database
          </button>

          <button
            onClick={onImport}
            disabled={isProcessing || !rawInput.trim()}
            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} /> Process & Add to DB
          </button>
        </div>
      </div>

      {/* Right Column - Preview Area */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm uppercase tracking-wide text-slate-400">Preview</h3>
          <p className="text-[11px] text-slate-500">Matches the data that will be persisted.</p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {previewItems.length > 0 ? (
            previewItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-500">
              Enter identify output to preview the cleaned item data before importing.
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);