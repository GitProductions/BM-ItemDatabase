import Link from 'next/link';
import { buildItemPath } from '@/lib/slug';
import { Item } from '@/types/items';
import { ItemCard } from '../item-card';
import Button from '../ui/Button';

type ResultsGridProps = {
  items: Item[];
  onEdit: (item: Item) => void;
  onPrefetch: (href: string) => void;
};

export function ResultsGrid({ items, onEdit, onPrefetch }: ResultsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pt-4">
      {items.map((item) => {
        const href = buildItemPath(item.id, item.keywords);
        return (
          <div key={item.id} className="relative">
            <ItemCard item={{ ...item }} />
            <Link
              href={href}
              prefetch={false}
              onMouseEnter={() => onPrefetch(href)}
              className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-700 text-orange-200 hover:text-white hover:border-orange-500 transition-colors"
            >
              View
            </Link>
            <Button
              size="sm"
              onClick={() => onEdit(item)}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 w-auto z-10 text-[10px] px-2 bg-transparent py-1 rounded text-white/40 hover:text-orange-400 hover:border-orange-500 hover:bg-transparent"
            >
              Edit Details
            </Button>
          </div>
        );
      })}
    </div>
  );
}
