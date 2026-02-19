"use client";

import { useState } from 'react';
import EditModal from '../modals/EditModal';
import { Item } from '@/types/items';

type EditSuggestionModalProps = {
  item: Item | null;
  onClose: () => void;
  onSubmitted?: () => void;
  proposerLocked?: string;
  hideAdminControls?: boolean;
  hideNameInput?: boolean;
};

export function EditSuggestionModal({
  item,
  onClose,
  onSubmitted,
  proposerLocked,
  hideAdminControls,
  hideNameInput,
}: EditSuggestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleClose = () => {
    setFeedback(null);
    onClose();
  };

  return (
    <EditModal
      item={item}
      open={Boolean(item)}
      isSubmitting={isSubmitting}
      feedback={feedback}
      onClose={handleClose}
      onSubmit={async ({ proposer, note, reason }) => {
        if (!item) return;
        setIsSubmitting(true);
        setFeedback(null);
        try {
          const res = await fetch('/api/suggestions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              itemId: item.id,
              note,
              proposer,
              reason,
            }),
          });
          if (!res.ok) throw new Error('Failed');
          setFeedback('Submitted for review. Thanks!');
          onSubmitted?.();
        } catch {
          setFeedback('Could not submit suggestion. Try again.');
        } finally {
          setIsSubmitting(false);
        }
      }}
      proposerLocked={proposerLocked}
      hideAdminControls={hideAdminControls}
      hideNameInput={hideNameInput}
    />
  );
}
