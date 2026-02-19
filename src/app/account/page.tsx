"use client";

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { User } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Item } from '@/types/items';
import PageHeader from '@/components/ui/PageHeader';
import Image from 'next/image';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';
import ProfileHeader from './_components/ProfileHeader';
import TokensSection from './_components/TokensSection';
import SubmissionsSection from './_components/SubmissionsSection';
import { EditSuggestionModal } from '@/components/search/edit-suggestion-modal';

export default function AccountPage() {
  const { data: session, status, update } = useSession();

  // Edit Item Modal state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [submissionsRefreshKey, setSubmissionsRefreshKey] = useState(0);

  // Handle opening suggestion modal for item
  const openSuggestion = (item: Item) => {
    setSelectedItem(item);
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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      <PageHeader
        title="My Account"
        description="Manage your profile and contributions"
        icons={<User size={24} className="text-orange-400" />}
      />

      <ProfileHeader
        session={session}
        update={update}
        onSignOut={() => signOut({ callbackUrl: '/' })}
      />

      <TokensSection />

      <SubmissionsSection onEdit={openSuggestion} refreshKey={submissionsRefreshKey} />

      {/* Edit modal for submitted items */}
      <EditSuggestionModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSubmitted={() => {
          setSelectedItem(null);
          setSubmissionsRefreshKey((prev) => prev + 1);
        }}
        hideAdminControls
        hideNameInput
        proposerLocked={session.user?.name ?? session.user?.email ?? undefined}
      />
    </div>
  );
}
