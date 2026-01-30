"use client";

import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Button from '@/components/ui/Button';
import { Item } from '@/types/items';
import EditModal from '@/components/modals/EditModal';

type Token = { id: string; label: string | null; createdAt: string; lastUsedAt: string | null };

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [tokenLabel, setTokenLabel] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load user's API tokens
  const loadTokens = async () => {
    const res = await fetch('/api/tokens', { cache: 'no-store' });
    if (!res.ok) throw new Error('Unable to load tokens');
    const data = (await res.json()) as { tokens: Token[] };
    setTokens(data.tokens);
  };

  // Load user's submitted items
  const loadItems = async () => {
    const res = await fetch('/api/user/items', { cache: 'no-store' });
    if (!res.ok) throw new Error('Unable to load your items');
    const data = (await res.json()) as { items: Item[] };
    setItems(data.items);
  };

  // Load User data on session change
  useEffect(() => {
    if (status !== 'authenticated') return;
    setError(null);
    Promise.all([loadTokens(), loadItems()]).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load account data'));
  }, [status]);

  // create new auth token for user
  const handleCreateToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: tokenLabel || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Unable to create token');
      }

      const data = (await res.json()) as { token: string };
      setNewToken(data.token);
      setTokenLabel('');
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
          <p className="text-xl font-semibold text-white">{session.user?.name}</p>
          <p className="text-sm text-zinc-500">{session.user?.email}</p>
        </div>
        <Button onClick={() => signOut({ callbackUrl: '/' })} className="bg-zinc-800 hover:bg-zinc-700">
          Sign out
        </Button>
      </div>

      {error ? <div className="text-sm text-rose-400 bg-rose-900/20 border border-rose-800 rounded-md px-3 py-2">{error}</div> : null}

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">API Tokens</h2>
            <p className="text-sm text-zinc-400">Use these with `Authorization: Bearer &lt;token&gt;` when POSTing to /api/items.</p>
          </div>
        </div>

        {newToken ? (
          <div className="rounded-md border border-emerald-700 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200">
            Copy this token now: <span className="font-mono">{newToken}</span>
          </div>
        ) : null}

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm text-zinc-300">Label (optional)</label>
            <input
              className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
              value={tokenLabel}
              onChange={(event) => setTokenLabel(event.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={handleCreateToken} disabled={loading}>
            {loading ? 'Working…' : 'Create token'}
          </Button>
        </div>

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

      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your submissions</h2>
          <Button variant="secondary" onClick={loadItems} disabled={loading}>
            Refresh
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing yet. Add items to see them here.</p>
        ) : (
          <div className="grid gap-2">
            {items.map((item) => (
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
                    <Button size="sm" variant="secondary" onClick={() => openSuggestion(item)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
