import React from 'react';
import ComboBox from './ui/comboBox';
import Input from './ui/Input';
import Button from './ui/Button';
import { Item, ItemAffect } from '@/types/items';

type ItemPreviewCardProps = {
  item: Item;
  editable?: boolean;
  onChange?: (item: Item) => void;
};

const DEFAULT_FLAG_OPTIONS = [
  'glow',
  'hum',
  'invis',
  'magic',
  'no-drop',
  'no-remove',
  'no-summon',
  'no-locate',
  'anti-evil',
  'anti-good',
  'anti-neutral',
  'burn-proof',
  'bless',
  'nodisarm',
  'inventory',
];

function ItemPreviewCard({ item, editable = false, onChange }: ItemPreviewCardProps) {
  const stats = item.stats ?? { affects: [] };
  const affects = stats.affects ?? [];
  const flagOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          [...DEFAULT_FLAG_OPTIONS, ...(item.flags ?? [])]
            .map((flag) => flag.trim().toLowerCase())
            .filter(Boolean),
        ),
      ),
    [item.flags],
  );

  const updateItem = (next: Partial<Item>) => {
    onChange?.({ ...item, ...next });
  };

  const updateStats = (next: Partial<Item['stats']>) => {
    const current = stats ?? { affects: [] };
    onChange?.({ ...item, stats: { ...current, ...next } });
  };

  const updateAffect = (idx: number, partial: Partial<ItemAffect>) => {
    const next = affects.map((affect, i) => (i === idx ? { ...affect, ...partial } : affect));
    updateStats({ affects: next });
  };

  const addAffect = () => {
    updateStats({ affects: [...affects, { type: 'stat', stat: '', value: 0 }] });
  };

  const removeAffect = (idx: number) => {
    const next = affects.filter((_, i) => i !== idx);
    updateStats({ affects: next });
  };

  if (!editable || !onChange) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-200 space-y-2">
        <div className="flex justify-between gap-3">
          <div className="font-semibold text-sm text-white">{item.name}</div>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-400">
            {item.type}
          </span>
        </div>
        <div className="text-zinc-400">
          Keywords: <span className="text-zinc-200 font-mono">{item.keywords}</span>
        </div>
        {item.ego && (
          <div className="text-zinc-400">
            Ego: <span className="text-zinc-200">{item.ego}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {item.flags.map((flag) => (
            <span
              key={flag}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 uppercase"
            >
              {flag}
            </span>
          ))}
        </div>
        <div className="space-y-1">
          {item.stats?.damage && (
            <div className="text-zinc-400">
              Damage: <span className="text-red-200 font-mono">{item.stats.damage}</span>
            </div>
          )}
          {typeof item.stats?.ac === 'number' && (
            <div className="text-zinc-400">
              AC: <span className="text-blue-200 font-mono">{item.stats.ac}</span>
            </div>
          )}
          {typeof item.stats?.weight === 'number' && (
            <div className="text-zinc-400">
              Weight: <span className="text-amber-200 font-mono">{item.stats.weight}</span>
            </div>
          )}
        </div>
        {item.stats?.affects?.length ? (
          <div className="space-y-1">
            <div className="text-[11px] uppercase text-zinc-500">Affects</div>
            <ul className="text-zinc-300 list-disc list-inside space-y-0.5">
              {item.stats.affects.map((affect, idx) => (
                <li key={idx} className="font-mono">
                  {affect.type === 'spell'
                    ? `Cast ${affect.spell ?? ''} (lvl ${affect.level ?? '?'})`
                    : `${affect.stat}: ${affect.value}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-orange-700/60 bg-zinc-950 p-4 text-xs text-zinc-200 space-y-3 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Name</span>

          <Input 
            value={item.name}
            onChange={(e) => updateItem({ name: e.target.value })}
            className="w-full rounded border px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Type</span>
          <Input
            value={item.type}
            onChange={(e) => updateItem({ type: e.target.value })}
            className="w-full rounded border  px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      <label className="text-[11px] uppercase text-zinc-400 space-y-1 block">
        <span>Keywords</span>
        <Input
          value={item.keywords}
          onChange={(e) => updateItem({ keywords: e.target.value })}
          className="w-full rounded border px-3 py-2 text-sm text-white"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Ego</span>
          <Input
            value={item.ego ?? ''}
            placeholder="optional"
            onChange={(e) => updateItem({ ego: e.target.value || undefined })}
            className="w-full rounded border px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Flags</span>
          <ComboBox
            options={flagOptions}
            value={item.flags ?? []}
            onChange={(selected) => updateItem({ flags: selected })}
            placeholder="Select or type flags"
          />
        </label>
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Worn slots</span>
          <ComboBox
            options={['head', 'neck', 'body', 'arms', 'hands', 'finger', 'waist', 'legs', 'feet', 'wrist']}
            value={item.worn || []}
            onChange={(selected) => updateItem({ worn: selected.length ? selected : undefined })}
            placeholder="Choose worn slots"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Damage</span>
          <Input
            value={stats.damage ?? ''}
            placeholder="e.g. 2d5+3"
            onChange={(e) => updateStats({ damage: e.target.value || undefined })}
            className="w-full rounded border px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>AC</span>
          <Input
            type="number"
            value={stats.ac ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              updateStats({ ac: val === '' ? undefined : Number(val) });
            }}
            className="w-full rounded border px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Weight</span>
          <Input
            type="number"
            value={stats.weight ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              updateStats({ weight: val === '' ? undefined : Number(val) });
            }}
            className="w-full rounded border px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-[11px] uppercase text-zinc-400 space-y-1">
          <span>Dropped by</span>
          <Input
            value={item.droppedBy ?? ''}
            onChange={(e) => updateItem({ droppedBy: e.target.value || undefined })}
            className="w-full rounded border px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-[11px] uppercase text-zinc-400 inline-flex items-center gap-2">
          <Input
            type="checkbox"
            checked={Boolean(item.isArtifact)}
            onChange={(e) => updateItem({ isArtifact: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500"
          />
          <span>Is artifact</span>
        </label>
      </div>

      <div className="border border-zinc-800 rounded-lg p-3 space-y-2 bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase text-zinc-400">Affects</span>
          <Button
            size="sm"
            onClick={addAffect}
            className="text-[11px] px-2 py-1 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-orange-500"
          >
            Add
          </Button>
        </div>

        {affects.length === 0 ? (
          <div className="text-zinc-500 text-xs">No affects. Add one to modify stats/spells.</div>
        ) : (
          <div className="space-y-2">
            {affects.map((affect, idx) => (
              <div
                key={`${affect.type}-${idx}`}
                className="grid grid-cols-1 md:grid-cols-[0.8fr,1fr,1fr,auto] gap-2 items-center"
              >
                <select
                  value={affect.type}
                  onChange={(e) => updateAffect(idx, { type: e.target.value as ItemAffect['type'] })}
                  className="rounded border h-8 border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="stat">Stat</option>
                  <option value="spell">Spell</option>
                </select>

                {affect.type === 'spell' ? (
                  <>
                    <Input
                      value={affect.spell ?? ''}
                      placeholder="Spell name"
                      onChange={(e) => updateAffect(idx, { spell: e.target.value })}
                      className="rounded border px-2 py-2 text-sm text-white"
                    />
                    <Input
                      type="number"
                      value={affect.level ?? ''}
                      placeholder="Level"
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAffect(idx, { level: val === '' ? undefined : Number(val) });
                      }}
                      className="rounded border px-2 py-2 text-sm text-white"
                    />
                  </>
                ) : (
                  <>
                    <Input
                      value={affect.stat ?? ''}
                      placeholder="Stat"
                      onChange={(e) => updateAffect(idx, { stat: e.target.value })}
                      className="rounded border px-2 py-2 text-sm text-white"
                    />
                    <Input
                      type="number"
                      value={affect.value ?? ''}
                      placeholder="Value"
                      onChange={(e) => {
                        const val = e.target.value;
                        updateAffect(idx, { value: val === '' ? undefined : Number(val) });
                      }}
                      className="rounded border px-2 py-2 text-sm text-white"
                    />
                  </>
                )}

                <Button
                  size="sm"
                  onClick={() => removeAffect(idx)}
                  className="text-[11px] px-2 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-rose-500 hover:text-white"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemPreviewCard;
