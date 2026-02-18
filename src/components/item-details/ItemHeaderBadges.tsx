import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

type ItemHeaderBadgesProps = {
    isArtifact?: boolean;
    isMergedView: boolean;
    flaggedForReview?: boolean;
    align?: 'left' | 'right';
    hideBadges?: boolean; // Option to hide badges, useful for when we want to show the badges in a different section/header but still want to use the component for layout purposes
    asRow?: boolean;
    children?: ReactNode;
};

export const ItemHeaderBadges = ({
    isArtifact,
    isMergedView,
    flaggedForReview,
    align = 'right',
    hideBadges = false,
    asRow = false,
    children,
}: ItemHeaderBadgesProps) => {

    // Note: the "Overall Stats" badge is shown on the merged view to indicate that the stats being shown are aggregated across all drops/variants
    //  as opposed to the "Original drop" badge which indicates that the stats are specific to that particular drop/variant.
    //  This is meant to help users understand the context of the stats being displayed,
    //  especially when viewing merged/combined views where it may not be immediately clear whether the stats are for a specific drop or aggregated across multiple drops.    

    const badges = (
        <div className={align === 'left' ? 'flex flex-wrap gap-2 justify-start' : 'flex flex-wrap gap-2 justify-end'}>

            {/* IsItem Artifact Flag */}
            {isArtifact ? (
                <span className="text-[11px] uppercase bg-amber-900/40 border border-amber-700 px-2 py-1 rounded-md text-amber-200">
                    Artifact
                </span>
            ) : null}


            {hideBadges ? null : (
                <>
                    {/* Letting user know if this is an original drop or overall */}
                    <span
                        className={
                            isMergedView
                                ? 'text-[11px] uppercase bg-orange-900/40 border border-orange-700 px-2 py-1 rounded-md text-orange-200'
                                : 'text-[11px] uppercase bg-emerald-900/40 border border-emerald-700 px-2 py-1 rounded-md text-emerald-200'
                        }
                    >
                        {isMergedView ? 'Overall Stats' : 'Original drop'}
                    </span>
                </>
            )}

            {/* Flagged for review badge */}
            {flaggedForReview ? (
                <span className="inline-flex items-center gap-1 text-[11px] uppercase bg-rose-900/40 border border-rose-700 px-2 py-1 rounded-md text-rose-200">
                    <AlertTriangle size={12} />
                    Needs review
                </span>
            ) : null}
        </div>
    );

    if (!asRow) return badges;

    return (
        <div className="flex flex-wrap items-center justify-between gap-2">

            {badges}
            {children ? <div className="text-xs text-zinc-400">{children}</div> : null}
        </div>
    );
};
