import React, { useMemo, useState, useEffect } from 'react';
import PageHeader from './ui/PageHeader';
import { Search, DatabaseSearch } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { matchesSlot, SlotKey, canonicalSlot, slotLabel, SLOT_CONFIG } from '@/lib/slots';
import ComboBox from './ui/ComboBox';

type ItemDBProps = Record<string, never>;

const PAGE_SIZE = 20;
const DEFAULT_LIMIT = PAGE_SIZE;
const SEARCH_LIMIT = PAGE_SIZE;
const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 400;

export const ItemDB: React.FC<ItemDBProps> = () => {
  const router = useRouter();
  const { items, refresh, totalCount, resultCount } = useAppData();
  
  const [search, setSearch] = useState('');
  const [filterType] = useState('all');
  const [slotFilter, setSlotFilter] = useState<string>('all');
  const slotOptions = useMemo(() => {
    const uniq = new Set<string>();
    uniq.add('all');
    SLOT_CONFIG.forEach((slot) => uniq.add(canonicalSlot(slot.key)));
    return Array.from(uniq);
  }, []);

  const [suggestItem, setSuggestItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestFeedback, setSuggestFeedback] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filteredItemsBySlot =
    slotFilter === 'all'
      ? items
      : items.filter((item) => {
          const target = canonicalSlot(slotFilter as SlotKey);
          return matchesSlot(item, target as SlotKey);
        });

  const filteredItems = filteredItemsBySlot; // server already applied search/type filters; slot applied client-side

  const hasFilters = filterType !== 'all' || search.trim().length >= MIN_SEARCH_LENGTH;
  const baseTotal = hasFilters ? resultCount : totalCount;
  const total = slotFilter === 'all' ? baseTotal : filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filteredItems;

  // Trigger server-side fetch when search or filter changes (debounced)
  useEffect(() => {
    const typeParam = filterType === 'all' ? undefined : filterType;
    const trimmed = search.trim();
    const hasSearch = trimmed.length >= MIN_SEARCH_LENGTH;
    const slotParam = slotFilter === 'all' ? undefined : slotFilter;

    const timeout = setTimeout(() => {
      // If user typed but hasn't reached the minimum length, don't refetch (unless a type filter is applied)
      if (!hasSearch && trimmed.length > 0 && !typeParam && !slotParam) return;

      const limit = hasSearch ? SEARCH_LIMIT : DEFAULT_LIMIT;
      const offset = (page - 1) * limit;
      void refresh({
        q: hasSearch ? trimmed : undefined,
        type: typeParam,
        limit,
        offset,
        silent: true,
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search, filterType, slotFilter, page, refresh]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterType, slotFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);



  return (
    <div className="">

      <PageHeader
        title="Item Database"
        description="Browse, filter, and search the community BlackMUD item database"
        icons={<DatabaseSearch className="text-orange-400" size={24} />}
        />
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4 md:items-end">

        {/* Main Search  */}
        <div className="relative flex-1 ">
           <span className="text-[11px] uppercase tracking-wide text-zinc-500">Search</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 mt-3" size={18} />
          
          <Input
            type="text"
            className="bg-zinc-950 border-zinc-700 rounded-lg pl-10 pr-3 h-10 text-sm"
            placeholder="Search by name, keywords, or stats (e.g. 'str', 'hit-n-dam')..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* Type Filter */}
        {/* <div className="flex flex-col gap-1 w-full md:w-72">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500 flex items-center gap-1">
            <Filter size={14} className="text-zinc-500" /> Type
          </span>
          <ComboBox
            options={uniqueTypes}
            value={[filterType]}
            allowCustom={false}
            onChange={(vals) => setFilterType(vals[0] ?? 'all')}
            placeholder="All types"
            className="w-full"
            size="md"
            singleSelect
          />
        </div> */}

        {/* Slot Filter */}
        <div className="flex flex-col gap-1 w-full md:w-72">
          <span className="text-[11px] uppercase tracking-wide text-zinc-500">Slot</span>
          <ComboBox
            options={slotOptions}
            value={[slotFilter]}
            allowCustom={false}
            onChange={(vals) => setSlotFilter(vals[0] ?? 'all')}
            placeholder="All slots"
            className="w-full"
            size="md"
            singleSelect
            labelForOption={(opt) => (opt === 'all' ? 'All slots' : slotLabel(opt as SlotKey))}
          />
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
                  // prefetch={active ? null : false}
                  // onMouseEnter={() => setActive(true)}
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(buildItemPath(item.id, item.keywords))}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded
                  bg-zinc-900/80 border border-zinc-700 text-orange-200 hover:text-white hover:border-orange-500 transition-colors"
                >
                  View
                </Link>

                {/* Suggest Edit Button */}
                <Button
                  // variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSuggestItem(item);
                    setSuggestFeedback(null);
                  }}
                  className='absolute bottom-0 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 w-auto z-10  text-[10px] px-2 bg-transparent py-1 rounded
                   text-white/40 hover:text-orange-400 hover:border-orange-500 hover:bg-transparent'
          
                >
                  Edit Details
                </Button>

              </div>
            ))}
          </div>
          <div className="pt-4 flex flex-col items-center gap-1">
          <Pagination total={total} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
            <p className="text-xs text-zinc-500">
              Page {page} of {totalPages} • {total} items total
            </p>
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
