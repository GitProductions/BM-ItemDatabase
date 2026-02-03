import React, { useMemo, useState, useEffect } from 'react';
import { Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { buildItemPath } from '@/lib/slug';
import { Item } from '@/types/items';
import { ItemCard } from './item-card';
import Image from 'next/image';
import EditModal from './modals/EditModal';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';
import Input from './ui/Input';
import Button from './ui/Button';
import Pagination from './ui/Pagination';
import { useAppData } from '@/components/app-provider';

type ItemDBProps = Record<string, never>;

const DEFAULT_LIMIT = 50;
const SEARCH_LIMIT = 50;
const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 400;

export const ItemDB: React.FC<ItemDBProps> = () => {
  const { items, refresh } = useAppData();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [suggestItem, setSuggestItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestFeedback, setSuggestFeedback] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map((item) => item.type));
    return ['all', ...Array.from(types)];
  }, [items]);

  // Trigger server-side fetch when search or filter changes (debounced)
  useEffect(() => {
    const typeParam = filterType === 'all' ? undefined : filterType;
    const trimmed = search.trim();
    const hasSearch = trimmed.length >= MIN_SEARCH_LENGTH;

    const timeout = setTimeout(() => {
      // If user typed but hasn't reached the minimum length, don't refetch (unless a type filter is applied)
      if (!hasSearch && trimmed.length > 0 && !typeParam) return;

      const limit = hasSearch ? SEARCH_LIMIT : DEFAULT_LIMIT;
      void refresh({ q: hasSearch ? trimmed : undefined, type: typeParam, limit, silent: true });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search, filterType, refresh]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterType]);

  

  const filteredItems = items; // server already applied search/type filters
  const total = filteredItems.length;
  const startIdx = (page - 1) * pageSize;
  const pageItems = filteredItems.slice(startIdx, startIdx + pageSize);

  return (
    <div className="">
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4">
       
        {/* Main Search  */}
        <div className="relative flex-1 ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />

          <Input 
            type="text"
            className="bg-zinc-950 border-zinc-700 rounded-lg pl-10"
            placeholder="Search by name, keywords, or stats (e.g. 'str', 'hit-n-dam')..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 items-center overflow-x-auto pb-3 md:pb-0">
          <Filter size={18} className="text-zinc-500 shrink-0" />
          {uniqueTypes.map((type) => (
            <Button
              key={type}
              size = 'sm'
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                filterType === type ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              
              }`}
            >
              {type}
            </Button>
          ))}

        
        </div>

      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pt-4">
            {pageItems.map((item) => (
              <div key={item.id} className="relative">
                <ItemCard item={{ ...item }} />

                <Link
                  href={buildItemPath(item.id, item.keywords)}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded
                  bg-zinc-900/80 border border-zinc-700 text-orange-200 hover:text-white hover:border-orange-500 transition-colors"
                >
                  View
                </Link>

                {/* Suggest Edit Button */}
                <Button
                  size="sm"
                  onClick={() => {
                    setSuggestItem(item);
                    setSuggestFeedback(null);
                  }}
                  className="absolute bottom-2 left-2 inline-flex items-center gap-1 w-auto z-10
                  text-[11px] px-2 py-1 rounded
                  bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:border-orange-500 hover:bg-transparent 
                  transition-colors"
                >
                  Edit
                </Button>

              </div>
            ))}
          </div>
          <div className="pt-4 flex justify-center">
            <Pagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </>
      ) : (

        // No results found
        <div className="text-center py-20 text-zinc-600">
          <Image src="/no-results.png" alt="No Results" width={200} height={200} className="mx-auto mb-4" />
          <p className="text-sm">
            {getRandomOrcPhrase('noSearchResults', 'random')}
          </p>
        </div>

      )}

      {/* Suggest Edit Modal */}
      <EditModal
        item={suggestItem}
        open={Boolean(suggestItem)}
        isSubmitting={isSubmitting}
        feedback={suggestFeedback}
        onClose={() => setSuggestItem(null)}
        onSubmit={async ({ proposer, note, reason }) => {
          if (!suggestItem) return;
          setIsSubmitting(true);
          setSuggestFeedback(null);
          try {
            const res = await fetch('/api/suggestions', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                itemId: suggestItem.id,
                note,
                proposer,
                reason,
              }),
            });
            if (!res.ok) throw new Error('Failed');
            setSuggestFeedback('Submitted for review. Thanks!');
          } catch {
            setSuggestFeedback('Could not submit suggestion. Try again.');
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </div>
  );
};
