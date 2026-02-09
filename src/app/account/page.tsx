"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Button from '@/components/ui/Button';
import { Item } from '@/types/items';
import EditModal from '@/components/modals/EditModal';
import UserIcon from '@/components/ui/UserIcon';
import Pagination from '@/components/ui/Pagination';
import { Pencil } from 'lucide-react';

type Token = { id: string; label: string | null; createdAt: string; lastUsedAt: string | null };

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [displayName, setDisplayName] = useState('');

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // User Tokens
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Edit Item Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Name Change state
  const [nameEditing, setNameEditing] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  // Load user's API tokens
  const loadTokens = async () => {
    const res = await fetch('/api/tokens', { cache: 'no-store' });
    if (!res.ok) throw new Error('Unable to load tokens');
    const data = (await res.json()) as { tokens: Token[] };
    setTokens(data.tokens);
  };

  // Load user's submitted items
  const loadItems = async () => {
    const res = await fetch('/api/user/items', 
      // { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('Unable to load your items');
    const data = (await res.json()) as { items: Item[] };
    setItems(data.items);
  };

  // Load User data on session change
  useEffect(() => {
    if (status !== 'authenticated') return;
    setDisplayName(session?.user?.name ?? '');
    setError(null);
    Promise.all([loadTokens(), loadItems()]).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load account data'));
  }, [status, session?.user?.name]);

  // reset pagination when items change
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  // create new auth token for user
  const handleCreateToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: 'mudlet' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Unable to create token');
      }

      const data = (await res.json()) as { token: string };
      setNewToken(data.token);
      setShowToken(true);
      setCopyStatus(null);
      // setTokenLabel('');
      await loadTokens();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create token');
    } finally {
      setLoading(false);
    }
  };

  // revoke auth tokens for user
  const handleRevoke = async (id: string) => {
    setLoading(true);
    try {
      await fetch('/api/tokens', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadTokens();
    } finally {
      setLoading(false);
    }
  };

  // Handle saving display name change
  const handleNameSave = async () => {
    if (!displayName.trim()) {
      return;
    }
    setNameEditing(false);
    setNameSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Unable to update name');
      }
      if (update) {
        await update({ name: displayName });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update name');
    } finally {
      setNameSaving(false);
    }
  };

  // Handle opening suggestion modal for item
  const openSuggestion = (item: Item) => {
    setSelectedItem(item);
    setSubmitFeedback(null);
    setModalOpen(true);
  };


  // Handling suggestion aka item edit submission
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
      await loadItems();
      setModalOpen(false);
    } catch (err) {
      setSubmitFeedback(err instanceof Error ? err.message : 'Could not submit suggestion.');
    } finally {
      setSubmitting(false);
    }
  };


  // Check session status
  if (status === 'loading') {
    return <p className="text-center text-zinc-400">Checking your session…</p>;
  }

  if (status !== 'authenticated') {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4">
        <p className="text-lg text-zinc-200">You need an account to view this page.</p>
        <Button onClick={() => signIn(undefined, { callbackUrl: '/account' })}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div>
          <p className="text-sm text-zinc-400">Signed in as</p>
          <div className="mt-1 mb-3 grid grid-cols-[auto,1fr] items-center gap-4">
            <UserIcon session={session} />

            <div>

              {/* <p className="text-xl font-semibold text-white">{session.user?.name}</p> */}
          

                {/* Showing input when user wants to change display name */}
                {nameEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        className="flex-1 rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={nameSaving}
                      />
                      <Button onClick={handleNameSave} disabled={nameSaving} variant="primary">
                        {nameSaving ? 'Saving…' : 'Save'}
                      </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold text-white">{session.user?.name || session.user?.email}</p>
                  <Button 
                    variant="secondary" 
                    className="ms-2 p-1 text-sm rounded-md text-zinc-400 hover:underline" 
                    onClick={() => setNameEditing(true)}
                  >
                    <Pencil size={12} className="inline mb-0.5 " /> 
                  </Button>
                  </div>
                )}

              <p className="text-sm text-zinc-500">{session.user?.email}</p>

              {session?.user?.isAdmin && (
                <p className="text-sm text-emerald-400">Admin</p>
              )}
              
            </div>

          </div>
        </div>
        <Button variant="danger" onClick={() => signOut({ callbackUrl: '/' })} >
          Sign out
        </Button>
      </div>

      {/* User Name change (OLD) */}
      {/* <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-semibold text-white">Display name</h2>
        <p className="text-sm text-zinc-400">
          Shown on your submissions. Set this to your in-game name.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={nameSaving}
          />
          <Button onClick={handleNameSave} disabled={nameSaving} variant="primary">
            {nameSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
        {nameStatus ? <p className="text-xs text-amber-300">{nameStatus}</p> : null}
      </section> */}

      {error ? <div className="text-sm text-rose-400 bg-rose-900/20 border border-rose-800 rounded-md px-3 py-2">{error}</div> : null}

      {/* API Token Section */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">API Tokens</h2>
            <p className="text-sm text-zinc-400">Use these with `Authorization: Bearer &lt;token&gt;` when POSTing to /api/items.</p>
          </div>
        </div>

        {/*  When new token is created */}
        {newToken ? (
          <div className="rounded-md border border-emerald-700 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200 flex items-center justify-between gap-3">
            <div>
              Copy this token now:{' '}
              <span className="font-mono">
                {showToken ? newToken : '••••••••••••••••••••••••••••••••'}
              </span>
              {copyStatus ? <span className="ml-2 text-emerald-300">{copyStatus}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  if (!newToken) return;
                  try {
                    await navigator.clipboard.writeText(newToken);
                    setCopyStatus('Copied');
                    setTimeout(() => setCopyStatus(null), 2000);
                  } catch {
                    setCopyStatus('Copy failed');
                    setTimeout(() => setCopyStatus(null), 2000);
                  }
                }}
              >
                Copy
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowToken((s) => !s)}>
                {showToken ? 'Hide' : 'Show'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNewToken(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 items-end">
          {tokens.length === 0 && (
            <Button onClick={handleCreateToken} disabled={loading} variant="primary">
              {loading ? 'Working…' : 'Create token'}
            </Button>
          )}
        </div>

        {/* Active token display */}
        <div className="space-y-2">
          {tokens.length === 0 ? (
            <p className="text-sm text-zinc-500">No active tokens yet.</p>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <p className="text-zinc-200">{token.label || 'Personal token'}</p>
                  <p className="text-xs text-zinc-500">
                    Created {new Date(token.createdAt).toLocaleString()} • Last used{' '}
                    {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : '—'}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => handleRevoke(token.id)} disabled={loading}>
                  Revoke
                </Button>
              </div>
            ))
          )}
        </div>

      </section>


      {/* User's submitted items */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your submissions</h2>

          <Button variant="primary" onClick={loadItems} disabled={loading}>
            Refresh
          </Button>

        </div>
        
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing yet. Add items to see them here.</p>
        ) : (
          <div className="grid gap-2">
            {items.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize).map((item) => (
              <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-100 font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.type} • keywords: {item.keywords || 'n/a'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-400">Updated {item.submissionCount ?? ''}</span>
                    <Button size="sm" variant="primary" onClick={() => openSuggestion(item)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="pt-3 flex justify-center">
          <Pagination total={items.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      </section>


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
