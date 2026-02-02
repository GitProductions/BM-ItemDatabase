import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function ItemNotFound() {
  return (
    <div className="max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Item not found</h1>
      <p className="text-sm text-zinc-400">
        We couldn&apos;t find an item with that ID. It may have been removed or hasn&apos;t been submitted yet.
      </p>
      <div className="flex justify-center gap-2">
        <Button as={Link} href="/" variant="secondary" size="sm">
          Back to items
        </Button>
        <Button as={Link} href="/add-item" size="sm">
          Add an item
        </Button>
      </div>
    </div>
  );
}
