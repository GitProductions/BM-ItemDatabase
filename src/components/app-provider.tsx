"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Item } from '@/types/items';

const AppDataContext = createContext<{
  items: Item[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  userName: string;
  handleSetUserName: (name: string) => void;
} | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const handleSetUserName = useCallback((name: string) => {
    setUserName(name);
    localStorage.setItem('bm-database-userName', name);
  }, []);

  useEffect(() => {
    const storedUserName = localStorage.getItem('bm-database-userName') || '';
    handleSetUserName(storedUserName);
    }, [handleSetUserName]);



  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/items', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load items');
      const data = await response.json();
      // setItems(normalizeItems(data.items ?? []));
      setItems(data.items ?? []);
    } catch (err) {
      console.error('Failed to load items', err);
      setError('Unable to load items from the database. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AppDataContext.Provider value={{ items, loading, error, refresh, userName, handleSetUserName   }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
