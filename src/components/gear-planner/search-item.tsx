import React, { useEffect, useState } from 'react';
import { Item } from '@/types/items';
import Input from '../ui/Input';

type SearchItemProps = {
  query: string;
  setQuery: (value: string) => void;
  filtered: Item[];
  onChange: (item: Item) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const SearchItem: React.FC<SearchItemProps> = ({ query, setQuery, filtered, onChange, containerRef }) => {
  const [open, setOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, containerRef]);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder="Search item name, keyword, type"
        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs"
      />

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-zinc-800 bg-zinc-950/95 shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-zinc-500">No matches.</div>
          ) : (
            filtered.map((item) =>
              item.id === '__search_more__' ? (
                <div
                  key={item.id}
                  className="w-full px-3 py-2 text-[11px] text-amber-200 bg-amber-900/20 border-t border-amber-700/40"
                >
                  Search to see more results
                </div>
              ) : (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-50 hover:bg-zinc-800/60 transition-colors border-b border-zinc-900 last:border-b-0"
                >
                  <div className="font-semibold text-sm truncate">{item.name}</div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {item.keywords} • <span className="uppercase">{item.type}</span>
                  </div>
                  {item.worn && item.worn.length ? (
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-orange-200">
                      {item.worn.map((slot) => (
                        <span
                          key={slot}
                          className="rounded border border-orange-800/70 bg-orange-900/30 px-2 py-0.5 uppercase tracking-wide"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              ),
            )
          )}
        </div>
      )}
    </div>
  );
};

export default SearchItem;
