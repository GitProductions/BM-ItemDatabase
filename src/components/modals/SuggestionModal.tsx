import React, { useEffect, useState } from 'react';
import { Item } from '@/types/items';
import { Modal } from '../modal';
import ItemPreviewCard from '../ItemPreviewCard';
import { useAppData } from '@/components/app-provider';


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

const SuggestionModal: React.FC<SuggestionModalProps> = ({ item, open, isSubmitting, feedback, onSubmit, onClose }) => {
    const { userName, handleSetUserName } = useAppData();
    const [name, setName] = useState(userName);
    const [note, setNote] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!open) return;
        const resetTimer = setTimeout(() => {
        setNote('');
        setReason('');
        setName(userName)
        }, 0);
        return () => clearTimeout(resetTimer);
    }, [open, item]);

  const handleSubmit = async () => {
    if (!item || !note.trim()) return;

    handleSetUserName(name);
    await onSubmit({ proposer: name.trim() || undefined, note: note.trim(), reason: reason.trim() || undefined });
  };

  return (
    <Modal open={open} onClose={onClose} title="Suggest an edit">
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          Propose a correction for <span className="text-white font-semibold">{item?.name}</span>.
        </p>


        {/* Item preview */}
        {item && (
            <ItemPreviewCard item={item} />
        )}


        {/* Suggestion form */}
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
