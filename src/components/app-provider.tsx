"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Item } from '@/types/items';

type FetchOptions = {
  q?: string;
  type?: string;
  limit?: number;
  offset?: number;
  flagged?: boolean;
  force?: boolean;
  silent?: boolean;
};

const AppDataContext = createContext<{
  setItems: (items: Item[]) => void;
  items: Item[];
  loading: boolean;
  error: string | null;
  refresh: (options?: FetchOptions) => Promise<void>;
  searchItems: (query: string, limit?: number) => Promise<void>;
  totalCount: number;
  resultCount: number;
  userName: string;
  handleSetUserName: (name: string) => void;
} | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [resultCount, setResultCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  const lastRequestRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSetUserName = useCallback(
    (name: string) => {
      if (session?.user?.name) {
        setUserName(session.user.name);
        return;
      }
      setUserName(name);
      localStorage.setItem('bm-database-userName', name);
    },
    [session?.user?.name],
  );

  useEffect(() => {
    const sessionName = session?.user?.name;
    if (sessionName) {
      setUserName(sessionName);
      localStorage.setItem('bm-database-userName', sessionName);
      return;
    }
    const storedUserName = localStorage.getItem('bm-database-userName') || '';
    setUserName(storedUserName);
  }, [session?.user?.name]);



  const refresh = useCallback(async (options: FetchOptions = {}) => {
    const params = new URLSearchParams();
    if (options.q) params.set('q', options.q);
    if (options.type) params.set('type', options.type);
    if (typeof options.flagged === 'boolean') params.set('flagged', options.flagged ? 'true' : 'false');

    const resolvedLimit = options.limit ?? (options.q ? undefined : 20);
    if (resolvedLimit) params.set('limit', String(resolvedLimit));
    if (Number.isFinite(options.offset)) params.set('offset', String(options.offset));

    const queryString = params.toString();
    const url = queryString ? `/api/items?${queryString}` : '/api/items';
    const requestKey = `${url}`;

    // Avoid hammering the API with identical back-to-back requests unless forced
    if (!options.force && requestKey === lastRequestRef.current) return;
    lastRequestRef.current = requestKey;

    if (!options.silent) setLoading(true);
    setError(null);

    // Cancel any in-flight request to avoid piling queries when typing
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(url, { signal: controller.signal, 
        cache: 'no-store' 
      });
      if (!response.ok) throw new Error('Failed to load items');
      const data = await response.json();
      const fetchedItems = data.items ?? [];
      setItems(fetchedItems);
      setTotalCount(typeof data.totalAll === 'number' ? data.totalAll : 0);
      setResultCount(typeof data.total === 'number' ? data.total : 0);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      console.error('Failed to load items', err);
      setError('Unable to load items from the database. Check your connection and try again.');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      if (!options.silent) setLoading(false);
    }
  }, []);

  const searchItems = useCallback(
    async (query: string, limit?: number) => {
      const trimmed = query.trim();
      await refresh({ q: trimmed || undefined, limit: limit ?? (trimmed ? undefined : 20) });
    },
    [refresh],
  );

  useEffect(() => {
    void refresh({ limit: 20 });
  }, [refresh]);

  return (
    <AppDataContext.Provider
      value={{ setItems, items, loading, error, refresh, searchItems, totalCount, resultCount, userName, handleSetUserName }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
