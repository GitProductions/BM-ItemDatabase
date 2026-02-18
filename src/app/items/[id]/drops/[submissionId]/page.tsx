import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft } from 'lucide-react';

import { fetchItemVariant, searchItems } from '@/lib/d1';
import { ItemCard } from '@/components/item-card';
import { buildItemPath } from '@/lib/slug';
import { OriginalDropMeta, IdentifyDump } from '@/components/item-details';
export const revalidate = 0;
export const dynamic = 'force-dynamic';

const fetchItem = cache(async (id: string) => {
    const items = await searchItems({ id });
    return items[0] ?? null;
});

type RouteParams = { id: string; submissionId: string };

export default async function ItemDropPage({ params }: { params: Promise<RouteParams> }) {
    const { id, submissionId } = await params;
    const item = await fetchItem(id);
    if (!item) notFound();

    const variant = await fetchItemVariant(id, submissionId);
    if (!variant?.parsedItem) notFound();

    const mergedItemUrl = buildItemPath(item.id, item.keywords);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-3">
                <Link href={mergedItemUrl} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
                    <ArrowLeft size={16} />
                    Back to merged view
                </Link>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Link href={`/items/${id}/drops`} className="text-orange-300 hover:underline">
                        All drops
                    </Link>
                </div>
            </div>

            <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">

                {/* IsOriginal Badge & TimeStamp */}
                <OriginalDropMeta submittedAt={variant.submittedAt} submittedBy={variant.submittedBy} />

                {/* Showing the Submission ID Requested */}
                <ItemCard item={variant.parsedItem} />


                 {/* If theres a raw dump then show it */}
                <IdentifyDump raw={variant.raw} collapsible />

            </section>
        </div>
    );
}
