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
  const { userName, handleSetUserName, refresh } = useAppData();
  const [name, setName] = useState(userName);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [adminToken, setAdminToken] = useState<string>('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [draftItem, setDraftItem] = useState<Item | null>(item);

  useEffect(() => {
    if (!open) return;
    const resetTimer = setTimeout(() => {
      setNote('');
      setReason('');
      setName(userName);
      setAdminStatus(null);
      setAdminError(null);
      setAdminMode(false);
      setDraftItem(item);
    }, 0);
    return () => clearTimeout(resetTimer);
  }, [open, item, userName]);

  useEffect(() => {
    if (!open) return;
    const cached =
      (typeof window !== 'undefined' && localStorage.getItem('bm-admin-token')) ||
      process.env.NEXT_PUBLIC_ADMIN_TOKEN ||
      '';
    setAdminToken(cached ?? '');
  }, [open]);

  const handleSubmit = async () => {
    if (!item || !note.trim()) return;

    handleSetUserName(name);
    await onSubmit({ proposer: name.trim() || undefined, note: note.trim(), reason: reason.trim() || undefined });
  };

  const handleDirectSave = async () => {
    if (!draftItem || !adminToken.trim()) {
      setAdminError('Admin token is required to save directly.');
      return;
    }

    setAdminSaving(true);
    setAdminError(null);
    setAdminStatus(null);

    try {
      const response = await fetch('/api/items', {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({ item: draftItem }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Failed to save item');
      }

      localStorage.setItem('bm-admin-token', adminToken.trim());
      setAdminStatus('Saved directly to the database.');
      await refresh();
    } catch (error) {
      console.error(error);
      setAdminError(error instanceof Error ? error.message : 'Could not save changes.');
    } finally {
      setAdminSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Suggest an edit">
      <div className="flex flex-col gap-4 max-h-[80vh]">
        <div className="text-sm text-zinc-400 px-1">
          Propose a correction for <span className="text-white font-semibold">{item?.name}</span>.
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-6">
          {/* Item preview */}
          {item && (
            <div className="space-y-3">
              <ItemPreviewCard
                // item={adminMode && draftItem ? draftItem : item}
                item ={draftItem ? draftItem : item}
                editable={true}
                onChange={setDraftItem}
              />
            </div>
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
        </div>

        <div className="sticky bottom-0 left-0 right-0 flex flex-wrap items-center gap-3 py-3 px-1 bg-zinc-950 border-t border-zinc-800">
          <label className="flex items-center gap-2 text-xs text-zinc-300 mr-auto">
            <input
              type="checkbox"
              checked={adminMode}
              onChange={(e) => setAdminMode(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500"
            />
            Enable direct edit (admin)
          </label>

          {adminMode && (
            <>
            <div className="flex-1" >
              <input
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="ADMIN_TOKEN"
                className="max-w-[200px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {adminStatus && <span className="text-xs text-green-300">{adminStatus}</span>}
              {adminError && <span className="text-xs text-rose-300">{adminError}</span>}
            </div>
            </>
          )}

          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md text-zinc-300 hover:text-white">
            Cancel
          </button>

          {adminMode ? (
            
            <button
              onClick={handleDirectSave}
              disabled={adminSaving || !draftItem}
              className="px-4 py-2 text-sm rounded-md bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adminSaving ? 'Saving�' : 'Save directly'}
            </button>
          ) : (
            <button
              disabled={isSubmitting || !note.trim()}
              onClick={handleSubmit}
              className="px-4 py-2 text-sm rounded-md bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SuggestionModal;
