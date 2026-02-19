"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Item } from '@/types/items';
import { useAppData } from '@/components/app-provider';
import { SlotKey, canonicalSlot, matchesSlot } from '@/lib/slots';

export const PAGE_SIZE = 20;
const DEFAULT_LIMIT = PAGE_SIZE;
const SEARCH_LIMIT = PAGE_SIZE;
export const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 400;

type UseSearchResultsArgs = {
  initialPage?: string;
  initialItems?: Item[];
  initialTotalCount?: number;
  initialResultCount?: number;
};

type UseSearchResultsState = {
  search: string;
  setSearch: (value: string) => void;
  slotFilter: string;
  setSlotFilter: (value: string) => void;
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  items: Item[];
  total: number;
  totalPages: number;
  hasResults: boolean;
};

export function useSearchResults({
  initialPage = '1',
  initialItems = [],
  initialTotalCount = 0,
  initialResultCount = 0,
}: UseSearchResultsArgs): UseSearchResultsState {
  const { items: appItems, refresh, totalCount, resultCount } = useAppData();

  const [search, setSearch] = useState('');
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const [pageState, setPageState] = useState(() => {
    const parsed = Number.parseInt(initialPage, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  const hasActiveSearch = search.trim().length >= MIN_SEARCH_LENGTH;

  const sourceItems = useMemo(() => {
    if (hasActiveSearch && appItems.length > 0) return appItems;
    if (!hasActiveSearch) return initialItems;
    return appItems;
  }, [appItems, hasActiveSearch, initialItems]);

  const filteredItems = useMemo(() => {
    if (slotFilter === 'all') return sourceItems;
    const target = canonicalSlot(slotFilter as SlotKey);
    return sourceItems.filter((item) => matchesSlot(item, target as SlotKey));
  }, [sourceItems, slotFilter]);

  const effectiveTotalCount = totalCount > 0 ? totalCount : initialTotalCount;
  const effectiveResultCount = resultCount > 0 ? resultCount : initialResultCount;
  const hasFilters = hasActiveSearch;
  const baseTotal = hasFilters ? effectiveResultCount : effectiveTotalCount;
  const total = slotFilter === 'all' ? baseTotal : filteredItems.length;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const page = useMemo(() => Math.max(1, Math.min(pageState, totalPages || 1)), [pageState, totalPages]);

  const setPage = useCallback(
    (value: number | ((prev: number) => number)) => {
      setPageState((prev) => {
        const next = Math.max(1, typeof value === 'function' ? value(prev) : value);
        return Math.min(next, totalPages || 1);
      });
    },
    [totalPages]
  );

  // Debounced fetch when search changes; keeps pagination/page size aligned with search
  useEffect(() => {
    const trimmed = search.trim();
    const hasSearch = trimmed.length >= MIN_SEARCH_LENGTH;
    const limit = hasSearch ? SEARCH_LIMIT : DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const timeout = setTimeout(() => {
      if (!hasSearch && trimmed.length > 0) return;

      void refresh({
        q: hasSearch ? trimmed : undefined,
        limit,
        offset,
        silent: true,
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search, page, refresh]);

  return {
    search,
    setSearch,
    slotFilter,
    setSlotFilter,
    page,
    setPage,
    items: useMemo(() => {
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      return filteredItems.slice(start, end);
    }, [filteredItems, page]),
    total,
    totalPages,
    hasResults: filteredItems.length > 0,
  };
}
