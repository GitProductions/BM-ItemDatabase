import Link from 'next/link';
import { notFound } from 'next/navigation';
// import PageHeader from '@/components/ui/PageHeader';
import { keywordsToSlug } from '@/lib/slug';
import { ArrowLeft, FileText } from 'lucide-react';
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
        return { title: 'Item drop not found' };
    }

    const timeNormalized = formatSubmittedAt(variant.submittedAt, { relativeWithinHours: 24 })

    return {
        title: `${variant.parsedItem.name} Drop`,
        description: `${variant.parsedItem.name} - dropped by ${variant.submittedBy} ${timeNormalized}. View drop stats & compare variants on BlackMUD Item Database.`,

        // Canonical URL is purposely pointing to the merged item view rather than the individual drop, since the drop pages are often near duplicates of the same item and may cause SEO issues
        // but we still want them to be crawlable and followable for discovery so we do not index but allow following
        alternates : {
            canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/items/${id}/${keywordsToSlug(variant.parsedItem.keywords)}`,
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
            <div className="flex items-center gap-3">
                <FileText className="text-orange-400" size={24} />
                <div>
                    <h1 className="text-2xl font-bold text-white">Original drop submission</h1>
                    <p className="text-sm text-zinc-400">Submitted by <span className="font-semibold text-orange-400">{variant.submittedBy}</span></p>
                </div>
            </div>
            <div className="text-xs text-zinc-500 text-right">
                <OriginalDropMeta submittedAt={variant.submittedAt} submittedBy={variant.submittedBy} />
            </div>
        </div>

            <div className="flex items-center justify-between gap-3">
                
                <Link href={mergedItemUrl} className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
                    <ArrowLeft size={16} />
                    Back to item page
                </Link>

                <Button as={Link} variant="secondary" size="sm" href={mergedItemUrl}>
                    View merged
                </Button>
            </div>

            <ItemCard item={variant.parsedItem} hideSubmittedBy />



            <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3">
                <IdentifyDump raw={variant.raw} collapsible />
            </section>
        </div>
    );
}
