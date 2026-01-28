import React, { useMemo, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { Item } from '@/types/items';
import { ItemCard } from './item-card';
import Image from 'next/image';
import SuggestionModal from './modals/SuggestionModal';

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


  // Fuzzy search helpers
  const getLevenshteinDistance = (source: string, target: string, maxDistance: number) => {
    if (Math.abs(source.length - target.length) > maxDistance) return maxDistance + 1;
    let previousRow = Array.from({ length: target.length + 1 }, (_, index) => index);
    for (let i = 1; i <= source.length; i += 1) {
      const currentRow = [i];
      let minRow = i;
      for (let j = 1; j <= target.length; j += 1) {
        const insertCost = currentRow[j - 1] + 1;
        const deleteCost = previousRow[j] + 1;
        const replaceCost = previousRow[j - 1] + (source[i - 1] === target[j - 1] ? 0 : 1);
        const value = Math.min(insertCost, deleteCost, replaceCost);
        currentRow.push(value);
        minRow = Math.min(minRow, value);
      }
      if (minRow > maxDistance) return maxDistance + 1;
      previousRow = currentRow;
    }
    return previousRow[previousRow.length - 1];
  };
  const calculateFuzzyTolerance = (token: string, candidateLength: number) => {
    if (!token) return 0;
    const baseLength = Math.max(token.length, candidateLength);
    return Math.min(4, Math.max(1, Math.ceil(baseLength * 0.32)));
  };
  const doesTokenMatchField = (token: string, value?: string) => {
    if (!value) return false;
    const normalized = value.toLowerCase();
    if (normalized.includes(token)) return true;

    const candidateWords = normalized.split(/[^a-z0-9]+/).filter(Boolean);
    return candidateWords.some((word) => {
      const tolerance = calculateFuzzyTolerance(token, word.length);
      if (Math.abs(token.length - word.length) > tolerance) {
        return false;
      }
      return getLevenshteinDistance(token, word, tolerance) <= tolerance;
    });
  };


  // Filtered items based on search and type filter
  const filteredItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (searchTerm.length === 0) {
      return items.filter(item =>
        filterType === 'all' ? true : item.type.includes(filterType)
      );
    }

    const tokens = searchTerm.split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      const stats = item.stats ?? { affects: [], weight: 0 };
      const affects = stats.affects ?? [];

      const matchesToken = (token: string) => {
        const coreFieldsMatch =
          doesTokenMatchField(token, item.name) ||
          doesTokenMatchField(token, item.keywords) ||
          doesTokenMatchField(token, item.type);
        if (coreFieldsMatch) return true;

        return affects.some(
          (affect) =>
            doesTokenMatchField(token, affect.stat) || doesTokenMatchField(token, affect.spell),
        );
      };

      const matchesSearch = tokens.every(matchesToken);
      const matchesType = filterType === 'all' ? true : item.type.includes(filterType);

      return matchesSearch && matchesType;
    });
  }, [items, search, filterType]);

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
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
              text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white hover:border-orange-500 transition-colors"
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
          <p className="text-sm">A half-orc says: Well, wattya lookin for?</p>
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
