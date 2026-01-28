import React, { useEffect, useState } from 'react';
import { Item } from '@/types/items';
import { Modal } from '../modal';

type SuggestionPayload = {
  proposer?: string;
  note: string;
  reason?: string;
};

type SuggestionModalProps = {
  item: Item | null;
  open: boolean;
  isSubmitting: boolean;
  feedback?: string | null;
  onSubmit: (payload: SuggestionPayload) => Promise<void>;
  onClose: () => void;
};

const SuggestionModal: React.FC<SuggestionModalProps> = ({
  item,
  open,
  isSubmitting,
  feedback,
  onSubmit,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setNote('');
      setReason('');
      setName('');
    }
  }, [open, item]);

  const handleSubmit = async () => {
    if (!item || !note.trim()) return;
    await onSubmit({ proposer: name.trim() || undefined, note: note.trim(), reason: reason.trim() || undefined });
  };

  return (
    <Modal open={open} onClose={onClose} title="Suggest an edit">
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          Propose a correction for <span className="text-white font-semibold">{item?.name}</span>.
        </p>

        {item && (
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
        )}

        <input
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />

        <textarea
          placeholder="Describe the edit you suggest..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full min-h-[8rem] rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />

        <textarea
          placeholder="Reason (why this change is needed)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full min-h-[5rem] rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
        />

        {feedback && <div className="text-sm text-amber-300">{feedback}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md text-zinc-300 hover:text-white">
            Cancel
          </button>
          <button
            disabled={isSubmitting || !note.trim()}
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-md bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SuggestionModal;
