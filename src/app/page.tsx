"use client";

import { ItemDB } from '@/components/database-view';
import { useAppData } from '@/components/app-provider';

export default function HomePage() {
  const { items, loading, error } = useAppData();

  return (
    <>
      {error && (
        <div className="rounded-xl border border-rose-800/60 bg-rose-900/20 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading items from the database...</div>
      ) : (
        <ItemDB items={items} />
      )}
    </>
  );
}
