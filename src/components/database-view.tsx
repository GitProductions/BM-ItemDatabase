import React, { useMemo, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { Item } from '@/types/items';
import { ItemCard } from './item-card';
import Image from 'next/image';
import SuggestionModal from './modals/SuggestionModal';
import uFuzzy from '@leeoniya/ufuzzy';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';

// uFuzzy tuned to allow common typos/transpositions while still ranking well.
const uf = new uFuzzy({
  intraMode: 1, // Crucial: enable SingleError (one typo per term)
  intraIns: 1, // Allow 1 insertion (extra char)
  intraSub: 1, // Allow 1 substitution (wrong char)
  intraDel: 1, // Allow 1 deletion (missing char)
  intraTrn: 1, // Allow 1 transposition (swapped adjacent chars)
  // Optional extras below - keep or remove based on testing
  // interIns: Infinity,   // Default - fine for item names
  intraChars: "[a-z\\\\d'-]", // Allow letters, digits, apostrophes, hyphens (common in item names)
});

type ItemDBProps = {
  items: Item[];
  onRefresh?: () => Promise<void> | void;
};

export const ItemDB: React.FC<ItemDBProps> = ({ items }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [suggestItem, setSuggestItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestFeedback, setSuggestFeedback] = useState<string | null>(null);

  const uniqueTypes = useMemo(() => {
    const types = new Set(items.map((item) => item.type));
    return ['all', ...Array.from(types)];
  }, [items]);

  // Filtered items based on search and type filter
  const filteredItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    const baseResults =
      searchTerm.length === 0
        ? items
        : (() => {
            const haystack = items.map((item) => {
              const affectsStr = (item.stats?.affects ?? [])
                .flatMap((affect) => [affect.stat, affect.spell])
                .filter(Boolean)
                .join(' ');

              return [item.name, item.keywords || '', item.type, affectsStr]
                .join(' | ')
                .toLowerCase();
            });

            const searchResult = uf.search(haystack, searchTerm);

            let uniqueIdxs: number[];

            if (searchResult && searchResult[0] && searchResult[0].length > 0) {
              const [idxs, info, order] = searchResult;

              const orderedIdxs =
                info && order ? order.map((ord) => info.idx[ord]) : Array.from(idxs);

              uniqueIdxs = Array.from(new Set(orderedIdxs));
            } else {
              // Fallback to simple substring includes when fuzzy misses (helps with very short/odd inputs)
              uniqueIdxs = haystack
                .map((text, idx) => (text.includes(searchTerm) ? idx : -1))
                .filter((idx) => idx !== -1);
            }

            return uniqueIdxs.map((idx) => items[idx]).filter(Boolean);
          })();

    if (filterType === 'all') return baseResults;

    return baseResults.filter((item) => item.type.includes(filterType));
  }, [items, search, filterType]);

  return (
    <div className="">
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4">
       
        {/* Main Search  */}
        <div className="relative flex-1 ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search by name, keywords, or stats (e.g. 'str', 'hit-n-dam')..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 items-center overflow-x-auto pb-3 md:pb-0">
          <Filter size={18} className="text-zinc-500 shrink-0" />
          {uniqueTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                filterType === type ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {type}
            </button>
          ))}

        
        </div>

      </div>

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pt-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="relative">
            <ItemCard item={{ ...item }} />

            {/* Suggest Edit Button */}
            <button
              onClick={() => {
                setSuggestItem(item);
                setSuggestFeedback(null);
              }}
              className="absolute bottom-2 left-2 inline-flex items-center gap-1 w-auto z-10
              md:top-2 md:right-2 md:left-auto md:bottom-auto
              text-[11px] px-2 py-1 rounded
              bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:border-orange-500 
              transition-colors"
            >
              Suggest edit
            </button>

          </div>
        ))}
      </div>
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
      <SuggestionModal
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
