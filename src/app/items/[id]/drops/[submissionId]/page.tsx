import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { fetchItemVariant } from '@/lib/d1';
import { formatSubmittedAt } from '@/lib/format-submitted-at';
import { ItemCard } from '@/components/item-card';
import { buildItemPath } from '@/lib/slug';
import { OriginalDropMeta, IdentifyDump } from '@/components/item-details';
import Button from '@/components/ui/Button';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type RouteParams = { id: string; submissionId: string };

export const generateMetadata = async ({ params }: { params: Promise<RouteParams> }) => {
    const { id, submissionId } = await params;
    const variant = await fetchItemVariant(id, submissionId);

    if (!variant?.parsedItem) {
        return { title: 'Item drop not found | BlackMUD Item DB' };
    }

    const timeNormalized = formatSubmittedAt(variant.submittedAt, { relativeWithinHours: 24 })

    return {
        title: `${variant.parsedItem.name} Drop | BlackMUD Item DB`,
        description: `${variant.parsedItem.name} was dropped and submitted by ${variant.submittedBy} ${timeNormalized}. View the original unmerged drop data for this submission, compare its stats against the other identical drop variants.`,

        // Canonical URL is purposely pointing to the merged item view rather than the individual drop, since the drop pages are often near duplicates of the same item and may cause SEO issues
        // but we still want them to be crawlable and followable for discovery so we do not index but allow following
        alternates : {
            canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/items/${id}`,
        },
        robots: {
            index: false,
            follow: true,
        },
    };
}

export default async function ItemDropPage({ params }: { params: Promise<RouteParams> }) {
    const { id, submissionId } = await params;
    const variant = await fetchItemVariant(id, submissionId);
    if (!variant?.parsedItem) notFound();

    const mergedItemUrl = buildItemPath(variant.itemId, variant.parsedItem.keywords);

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            <div className="flex items-center justify-between gap-3">
                <Link href={mergedItemUrl} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
                    <ArrowLeft size={16} />
                    Back to item page
                </Link>
                <Button variant="secondary" as={Link} size="sm" href={mergedItemUrl}>
                    View merged
                </Button>
            </div>

            <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <div className="flex items-center justify-between">

                    {/* Page title */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300">Original Drop Submission</p>
                            {/* <h1 className="text-3xl font-bold text-white leading-tight">{variant.parsedItem.name || 'Unnamed item'}</h1> */}
                        </div>
                    </div>

                    <p className="text-zinc-500 px-2 py-1">
                        <OriginalDropMeta submittedAt={variant.submittedAt} submittedBy={variant.submittedBy} />
                    </p>
                </div>

                <ItemCard item={variant.parsedItem} />
                <IdentifyDump raw={variant.raw} collapsible />
            </section>
        </div>
    );
}
