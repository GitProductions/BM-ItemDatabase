import React from 'react';
import { RefreshCcw, Shield, Weight, Zap } from 'lucide-react';
import Button from '../../ui/Button';
import ProfileManager from './profile-manager';

interface SummaryProps {
  totals: {
    totalAC: number;
    totalWeight: number;
    count: number;
    affectsTotals: Map<string, number>;
    damages: string[];
  };
  reset: () => void;
  currentSetName?: string;
  gearSets?: string[];
  onLoadSet?: (name: string) => void;
  onSaveSet?: () => void;
  onNewSet?: () => void;
}

function Summary({ totals, reset, currentSetName = "Default", gearSets = [], onLoadSet, onSaveSet, onNewSet }: SummaryProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-inner">

      {/* Header: Set selector + Reset button & Profile Selection */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3 pb-2.5 border-b border-zinc-800/60">

        {/* Equipment Profile Manager */}
        <ProfileManager
          currentSetName={currentSetName}
          gearSets={gearSets}
          onLoadSet={onLoadSet}
          onSaveSet={onSaveSet}
          onNewSet={onNewSet}
        />


        <Button
          variant="ghost"
          onClick={reset}
          className="flex items-center gap-1.5 text-xs rounded-md px-2.5 py-1.5"
        >
          <RefreshCcw size={13} /> Reset
        </Button>

      </div>


      {/* Main content: modifiers left | small AC + Weight right */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr,1fr] gap-3">
        {
        /* Left: Item Stats */}
        <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/50 p-3 order-2 lg:order-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={14} className="text-orange-400/90" />
            <h4 className="text-xs uppercase font-semibold text-zinc-400 tracking-wide">Modifiers</h4>
          </div>

          {totals.affectsTotals.size === 0 ? (
            <p className="text-xs text-zinc-600 italic py-1">No stat changes from equipped gear</p>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2.5 gap-y-1.5 text-xs">
              {Array.from(totals.affectsTotals.entries()).map(([stat, value]) => (
                <div
                  key={stat}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded bg-zinc-900/40 border border-zinc-800/40"
                >
                  <span className="text-zinc-300 capitalize truncate pr-2">{stat}</span>
                  <span
                    className={`font-bold tabular-nums min-w-[2.5ch] text-right ${
                      value >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Right: AC + Weight */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 order-1 lg:order-2 ">
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Shield size={13} className="text-blue-400/80" />
              <span className="text-[10px] uppercase font-medium text-zinc-500">AC</span>
            </div>
            <div className="text-2xl font-bold text-white leading-tight">{totals.totalAC}</div>
          </div>

          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Weight size={13} className="text-amber-400/80" />
              <span className="text-[10px] uppercase font-medium text-zinc-500">Wt</span>
            </div>
            <div className="text-2xl font-bold text-white leading-tight">
              {totals.totalWeight}
              <span className="text-xs text-zinc-500 ml-1">lb</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;