import Link from 'next/link';

import { formatSubmittedAt } from '@/lib/format-submitted-at';

type RecentDrop = {
    submissionId: string;
    submittedAt: string;
    submittedBy?: string;
};

type RecentDropsListProps = {
    itemId: string;
    recentVariants: RecentDrop[];
    submissionCount: number;
    variantsHref: string;
};

export const RecentDropsList = ({ itemId, recentVariants, submissionCount, variantsHref }: RecentDropsListProps) => (
    <div className="space-y-2">

        <div className="flex items-center justify-between">

            <h3 className="text-sm font-semibold text-white">Recent drops</h3>

            <Link href={variantsHref} className="text-xs text-orange-300 hover:underline">
                View all {submissionCount}
            </Link>

        </div>

        {/* If any variants available, show link and short details */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 divide-y divide-zinc-800">
            {recentVariants.map((variant) => (
                <div key={variant.submissionId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">

                    <Link href={`/items/${itemId}/drops/${variant.submissionId}`} className="text-orange-300 hover:underline">
                        Recent submission by {variant.submittedBy ?? 'Unknown'}
                    </Link>

                    <span className="text-xs text-zinc-500">
                        {formatSubmittedAt(variant.submittedAt, { relativeWithinHours: 24 })}
                    </span>
                    
                </div>
            ))}

        </div>
    </div>
);
