import React from 'react';
import { Database, Filter, Search } from 'lucide-react';
import { Item } from '@/types/items';
import { ItemCard } from './item-card';

type DatabaseViewProps = {
  items: Item[];
  search: string;
  filterType: string;
  uniqueTypes: string[];
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
};

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  items,
  search,
  filterType,
  uniqueTypes,
  onSearchChange,
  onFilterChange,
}) => (
  <div className="space-y-6">
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 text-zinc-500" size={18} />
        <input
          type="text"
          placeholder="Search by name, keywords, or stats (e.g. 'str', 'hit-n-dam')..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
        />
      </div>
      <div className="flex gap-2 items-center overflow-x-auto pb-2 md:pb-0">
        <Filter size={18} className="text-zinc-500 shrink-0" />
        {uniqueTypes.map((type) => (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${
              filterType === type ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>

    {items.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    ) : (
      <div className="text-center py-20 text-zinc-600">
        <Database size={48} className="mx-auto mb-4 opacity-20" />
        <p>No artifacts found matching your query.</p>
      </div>
    )}
  </div>
);
