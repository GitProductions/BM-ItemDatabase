import React, { useEffect, useState } from 'react';
import { Item } from '@/types/items';
import { Modal } from '../modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import Checkbox from '../ui/CheckBox';
import ItemPreviewCard from '../ItemPreviewCard';
import { useAppData } from '@/components/app-provider';
import { useSession } from 'next-auth/react';

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
  hideAdminControls?: boolean;
  hideNameInput?: boolean;
  proposerLocked?: string;
};


// const knownStatTypes = [
//   'damroll',
//   'damage',

//   'hitroll',
//   'hit',

//   'hit-n-dam',

//   'armor',
//   'ac',

//   'hp',
//   'hp-regen',
//   'hitpoints'
//   ,
//   'mana_regen',
//   'mana',

//   'movement',
//   'move_regen',
//   'move',

//   'strength',
//   'intelligence',
//   'wisdom',
//   'dexterity',
//   'constitution',
//   'charisma',

//   'save_all',

//   'weight',

// ];

// const knownItemFlags = [
//   'glowing',
//   'hum',
//   'invisible',
//   'magic',
//   'nodrop',
//   'bless',

//   'anti_good',
//   'anti_evil',
//   'anti_neutral',

//   'noremove',
// ]  

const EditModal: React.FC<SuggestionModalProps> = ({ item, open, isSubmitting, feedback, onSubmit, onClose, hideAdminControls = false, hideNameInput = false, proposerLocked }) => {
  const { data: session } = useSession();
  const { userName, handleSetUserName, refresh, items, setItems } = useAppData();
  const isAdminUser = Boolean(session?.user?.isAdmin);
  const [name, setName] = useState(proposerLocked ?? userName);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [adminToken, setAdminToken] = useState<string>('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [draftItem, setDraftItem] = useState<Item | null>(item);


  // Reset form to default on open
  useEffect(() => {
    if (!open) return;
    const resetTimer = setTimeout(() => {
      setNote('');
      setReason('');
      setName(proposerLocked ?? userName);
      setAdminStatus(null);
      setAdminError(null);
      setAdminMode(isAdminUser);
      setDraftItem(item);
    }, 0);
    return () => clearTimeout(resetTimer);
  }, [open, item, userName, proposerLocked, isAdminUser]);


  // Load stored admin token from localStorage or env on open
  useEffect(() => {
    if (!open) return;
    const cached =
      (typeof window !== 'undefined' && localStorage.getItem('bm-admin-token')) ||
      process.env.NEXT_PUBLIC_ADMIN_TOKEN ||
      '';
    setAdminToken(cached ?? '');
  }, [open]);


  // Handle form submission
  const handleSubmit = async () => {
    if (!item || !reason.trim()) return;

    handleSetUserName(proposerLocked ?? name);
    await onSubmit({
      proposer: (proposerLocked ?? name).trim() || undefined,
      note: note.trim(),
      reason: reason.trim() || undefined,
    });
  };

  // Handle item deletion (admin mode)
  const handleDeleteItem = async () => {
    if (!item || (!adminToken.trim() && !isAdminUser)) {
      setAdminError('Admin token is required to delete an item.');
      return;
    }
    const confirm = window.confirm(`Are you sure you want to delete the item "${item.name}"? This action cannot be undone.`);
    if (!confirm) return;
    setAdminSaving(true);
    setAdminError(null);
    setAdminStatus(null);
    try {
      const response = await fetch('/api/items', {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json',
          ...(adminToken.trim() ? { authorization: `Bearer ${adminToken.trim()}` } : {}),
        },
        body: JSON.stringify({ id: item.id }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Failed to delete item');
      }

    } catch (error) {
      console.error(error);
      setAdminError(error instanceof Error ? error.message : 'Could not delete item.');
      return;
    } finally {
      // Closing the modal on success

      // instead of refreshing the data as a whole and making an extra DB call that wouldnt be needed
      // lets just remove the item from view
      setItems(items.filter((i) => i.id !== item.id));

      // await refresh();
      onClose();
      setAdminSaving(false);
    }
  };

  // Handle direct save (admin mode)
  const handleDirectSave = async () => {
    if (!draftItem || (!adminToken.trim() && !isAdminUser)) {
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
          ...(adminToken.trim() ? { authorization: `Bearer ${adminToken.trim()}` } : {}),
        },
        body: JSON.stringify({ item: draftItem }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Failed to save item');
      }

      if (adminToken.trim()) {
        localStorage.setItem('bm-admin-token', adminToken.trim());
      }
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

              {/* Our Editable Card */}
              <ItemPreviewCard
                item={draftItem ? draftItem : item}
                editable={true}
                onChange={setDraftItem}
              />

            </div>
          )}

          {/* Suggestion form */}
          {!hideNameInput && (
            <Input
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border  px-3 py-2 text-sm"
            />
          )}

          <div className="space-y-1">
            <label htmlFor="edit-reason" className="block text-xs text-zinc-300 px-1">
              Reason for Edit <span className="text-orange-400">*</span>
            </label>
            <TextArea
              id="edit-reason"
              required
              aria-required="true"
              placeholder="Reason (why this change is needed)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full h-[4rem] min-h-[5rem] max-h-[8rem] ${!reason.trim() ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400' : ''}`}
            />
          </div>

          {/* <TextArea
            placeholder="Reason (why this change is needed)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-[4rem] min-h-[5rem] max-h-[8rem] "
          /> */}

          {feedback && <div className="text-sm text-amber-300">{feedback}</div>}
        </div>

        <div className="sticky bottom-0 left-0 right-0 flex flex-wrap items-center gap-3 py-3 px-1 bg-zinc-950 border-t border-zinc-800">


          {/* Display 'Admin' checkbox if user is owner of the item or an admin */}
          {!hideAdminControls && (
            <>
              <label className="flex items-center gap-2 text-xs text-zinc-300 mr-auto">
                <Checkbox
                  checked={adminMode}
                  onChange={(e) => setAdminMode(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                />
                Enable direct edit (admin)
              </label>

              {adminMode && !isAdminUser && (
                <div className="flex-1">
                  <Input
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    placeholder="ADMIN_TOKEN"
                    className="max-w-[200px] rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
                  />
                  {adminStatus && <span className="text-xs text-green-300">{adminStatus}</span>}
                  {adminError && <span className="text-xs text-rose-300">{adminError}</span>}
                </div>
              )}
            </>
          )}

          <Button onClick={onClose} className="px-3 py-2 text-sm rounded-md text-zinc-300 hover:text-white " variant="secondary">
            Cancel
          </Button>

          {adminMode && (adminToken || isAdminUser) ? (
            <>

              <Button
                onClick={handleDeleteItem}
                disabled={adminSaving || !draftItem}
                className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminSaving ? 'Deleting�' : 'Delete Item'}
              </Button>

              <Button
                onClick={handleDirectSave}
                disabled={adminSaving || !draftItem}
                className="px-4 py-2 text-sm rounded-md bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminSaving ? 'Saving�' : 'Save directly'}
              </Button>
            </>
          ) : (

            <Button
              title={!reason.trim() ? 'Please describe why you are making this edit before submitting' : ''}
              disabled={isSubmitting || !reason.trim()}
              onClick={handleSubmit}
              className="px-4 py-2 text-sm rounded-md bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditModal;
