import { useEffect, useState } from 'react';
import { Item } from '@/types/items';

export const useSubmissions = (refreshKey?: number) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadItems = async () => {
    const res = await fetch('/api/user/items');
    if (!res.ok) throw new Error('Unable to load your items');
    const data = (await res.json()) as { items: Item[] };
    setItems(data.items);
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  return {
    items,
    loading,
    error,
    page,
    pageSize,
    setPage,
    refresh,
  };
};
