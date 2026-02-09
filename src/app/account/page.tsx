"use client";

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Button from '@/components/ui/Button';
import { Item } from '@/types/items';
import EditModal from '@/components/modals/EditModal';
import Image from 'next/image';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';
import ProfileHeader from './_components/ProfileHeader';
import TokensSection from './_components/TokensSection';
import SubmissionsSection from './_components/SubmissionsSection';

export default function AccountPage() {
  const { data: session, status, update } = useSession();

  // Edit Item Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0);

  // Handle opening suggestion modal for item
  const openSuggestion = (item: Item) => {
    setSelectedItem(item);
    setSubmitFeedback(null);
    setModalOpen(true);
  };

  // Handling suggestion aka item edit submission endpoint
  const handleSuggestionSubmit = async (payload: { proposer?: string; note: string; reason?: string }) => {
    if (!selectedItem) return;
    setSubmitting(true);
    setSubmitFeedback(null);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          note: payload.note,
          proposer: payload.proposer,
          reason: payload.reason,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Failed to submit suggestion');
      }
      setSubmitFeedback('Suggestion sent for review. Thanks!');
      setModalOpen(false);
      setSubmissionsRefreshKey((prev) => prev + 1);
    } catch (err) {
      setSubmitFeedback(err instanceof Error ? err.message : 'Could not submit suggestion.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check session status
  if (status === 'loading') {
    return <p className="text-center text-zinc-400">Checking your session???</p>;
  }

  if (status !== 'authenticated') {
    return (
      <div className="max-w-xl mx-auto text-center space-y-8">
        <div className="space-y-2">
          <Image src="/no-results.png" alt="No results" width={120} height={120} className="mx-auto opacity-100 animate-pulse" />
          <p className='text-lg text-zinc-200 bg-black/20 border border-zinc-800 rounded-md px-4 py-2 inline-block'>
            {getRandomOrcPhrase("notLoggedIn")}
          </p>
        </div>

        <Button onClick={() => signIn(undefined, { callbackUrl: '/login' })}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProfileHeader
        session={session}
        update={update}
        onSignOut={() => signOut({ callbackUrl: '/' })}
      />

      <TokensSection />

      <SubmissionsSection onEdit={openSuggestion} refreshKey={submissionsRefreshKey} />

      {/* Edit modal for submitted items */}
      <EditModal
        item={selectedItem}
        open={modalOpen}
        feedback={submitFeedback}
        isSubmitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSuggestionSubmit}
        hideAdminControls
        hideNameInput
        proposerLocked={session.user?.name ?? session.user?.email ?? undefined}
      />
    </div>
  );
}
