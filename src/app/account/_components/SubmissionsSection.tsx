"use client";

import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { Item } from '@/types/items';
import { useSubmissions } from '../_hooks/useSubmissions';

type SubmissionsSectionProps = {
  onEdit: (item: Item) => void;
  refreshKey?: number;
};

export default function SubmissionsSection({ onEdit, refreshKey }: SubmissionsSectionProps) {
  const { items, loading, error, page, pageSize, setPage, refresh } = useSubmissions(refreshKey);

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Your submissions</h2>

        <Button variant="primary" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="text-sm text-rose-400 bg-rose-900/20 border border-rose-800 rounded-md px-3 py-2">
          {error}
        </div>
      ) : null}

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
                    {item.type} â€¢ keywords: {item.keywords || 'n/a'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-400">Updated {item.submissionCount ?? ''}</span>
                  <Button size="sm" variant="primary" onClick={() => onEdit(item)}>
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
  );
}
