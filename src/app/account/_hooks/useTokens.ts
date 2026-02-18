import { useEffect, useState } from 'react';

type Token = { id: string; label: string | null; createdAt: string; lastUsedAt: string | null };

export const useTokens = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, string>>({});
  const [revealLoading, setRevealLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = async () => {
    const res = await fetch('/api/tokens', { cache: 'no-store' });
    if (!res.ok) throw new Error('Unable to load tokens');
    const data = (await res.json()) as { tokens: Token[] };
    setTokens(data.tokens);
  };

  useEffect(() => {
    loadTokens().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load tokens'));
  }, []);

  const createToken = async () => {
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
      await loadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create token');
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async (id: string) => {
    setLoading(true);
    try {
      await fetch('/api/tokens', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadTokens();
      setRevealedTokens((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const revealToken = async (id: string) => {
    setRevealLoading(id);
    setError(null);
    try {
      const res = await fetch('/api/tokens/reveal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Unable to reveal token');
      }
      const data = (await res.json()) as { token: string };
      setRevealedTokens((prev) => ({ ...prev, [id]: data.token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reveal token');
    } finally {
      setRevealLoading(null);
    }
  };

  const dismissNewToken = () => setNewToken(null);
  const toggleShowNewToken = () => setShowToken((prev) => !prev);

  return {
    tokens,
    loading,
    error,
    newToken,
    showToken,
    copyStatus,
    revealedTokens,
    revealLoading,
    loadTokens,
    createToken,
    revokeToken,
    revealToken,
    dismissNewToken,
    toggleShowNewToken,
    setCopyStatus,
  };
};
