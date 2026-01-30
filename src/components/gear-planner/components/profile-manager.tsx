import React from 'react';
import { Save, FolderOpen, ChevronDown } from 'lucide-react';


function ProfileManager({ currentSetName, gearSets = [], onLoadSet, onSaveSet, onNewSet }: { currentSetName?: string; gearSets?: string[]; onLoadSet?: (name: string) => void; onSaveSet?: () => void; onNewSet?: () => void }) {
  return (
            <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-100">Gear Summary</h3>
          <div className="h-5 w-px bg-zinc-700" aria-hidden="true" />

          <div className="flex items-center gap-2 text-xs">
            <FolderOpen size={13} className="text-zinc-400" />
            <span className="text-zinc-400 font-medium">Set:</span>

            <div className="relative min-w-[100px]">
              <select
                value={currentSetName}
                onChange={(e) => onLoadSet?.(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white appearance-none pr-7 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {gearSets.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                {!gearSets.length && <option value="Default">Default</option>}
              </select>
              <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>

            <button
              onClick={onSaveSet}
              className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              title="Save set"
            >
              <Save size={13} />
            </button>
            <button
              onClick={onNewSet}
              className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors"
            >
              New
            </button>
          </div>
        </div>
  )
}

export default ProfileManager
