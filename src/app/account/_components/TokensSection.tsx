"use client";

import Button from '@/components/ui/Button';
import { useTokens } from '../_hooks/useTokens';

export default function TokensSection() {
  const {
    tokens,
    loading,
    error,
    newToken,
    showToken,
    copyStatus,
    revealedTokens,
    revealLoading,
    createToken,
    revokeToken,
    revealToken,
    dismissNewToken,
    toggleShowNewToken,
    setCopyStatus,
  } = useTokens();

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">API Tokens</h2>
          <p className="text-sm text-zinc-400">Use these with `Authorization: Bearer &lt;token&gt;` when POSTing to /api/items.</p>
        </div>
      </div>

      {error ? (
        <div className="text-sm text-rose-400 bg-rose-900/20 border border-rose-800 rounded-md px-3 py-2">
          {error}
        </div>
      ) : null}

      {newToken ? (
        <div className="rounded-md border border-emerald-700 bg-emerald-900/20 px-3 py-2 text-sm text-emerald-200 flex items-center justify-between gap-3">
          <div>
            Copy this token now:{' '}
            <span className="font-mono">
              {showToken ? newToken : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}
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
            <Button size="sm" variant="secondary" onClick={toggleShowNewToken}>
              {showToken ? 'Hide' : 'Show'}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissNewToken}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 items-end">
        {tokens.length === 0 && (
          <Button onClick={createToken} disabled={loading} variant="primary">
            {loading ? 'Creatingâ€¦' : 'Create token'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {tokens.length === 0 ? (
          <p className="text-sm text-zinc-500">No active tokens yet.</p>
        ) : (
          tokens.map((token) => (
            <div
              key={token.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-zinc-200">{token.label || 'Personal token'}</p>
                  <p className="text-xs text-zinc-500">
                    Created {new Date(token.createdAt).toLocaleString()} â€¢ Last used{' '}
                    {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => revealToken(token.id)}
                    disabled={loading || revealLoading === token.id}
                  >
                    {revealLoading === token.id ? 'Revealingâ€¦' : 'Reveal'}
                  </Button>
                  <Button variant="secondary" onClick={() => revokeToken(token.id)} disabled={loading}>
                    Revoke
                  </Button>
                </div>
              </div>

              {revealedTokens[token.id] ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs">
                  <span className="font-mono text-emerald-200 break-all">{revealedTokens[token.id]}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(revealedTokens[token.id]);
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
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
