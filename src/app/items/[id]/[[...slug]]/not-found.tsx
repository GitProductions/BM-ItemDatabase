import Link from 'next/link';

export default function ItemNotFound() {
  return (
    <div className="max-w-xl mx-auto text-center space-y-4">
      <h1 className="text-2xl font-bold text-white">Item not found</h1>
      <p className="text-sm text-zinc-400">
        We couldn&apos;t find an item with that ID. It may have been removed or hasn&apos;t been submitted yet.
      </p>
      <div className="flex justify-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 hover:border-orange-500 transition-colors"
        >
          Back to items
        </Link>
        <Link
          href="/add-item"
          className="inline-flex items-center justify-center rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-black hover:bg-orange-400 transition-colors"
        >
          Add an item
        </Link>
      </div>
    </div>
  );
}
