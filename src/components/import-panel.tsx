import React from 'react';
import { Save, Terminal, Trash2 } from 'lucide-react';

type ImportPanelProps = {
  rawInput: string;
  onRawInputChange: (value: string) => void;
  onImport: () => void;
  onClear: () => void;
};

export const ImportPanel: React.FC<ImportPanelProps> = ({ rawInput, onRawInputChange, onImport, onClear }) => (
  <div className="max-w-3xl mx-auto">
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <Terminal className="text-emerald-500" />
        <h2 className="text-lg font-bold text-white">Import Identify Data</h2>
      </div>

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
        className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-4"
      />

      <div className="flex justify-between items-center">
        <button
          onClick={onClear}
          className="px-4 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Trash2 size={16} /> Clear Database
        </button>

        <button
          onClick={onImport}
          disabled={!rawInput.trim()}
          className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save size={18} /> Process & Add to DB
        </button>
      </div>
    </div>
  </div>
);
