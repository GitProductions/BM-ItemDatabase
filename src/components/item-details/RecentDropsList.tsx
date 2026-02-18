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

export const RecentDropsList = ({
  itemId,
  recentVariants,
  submissionCount,
  variantsHref,
}: RecentDropsListProps) => {
  const displayed = recentVariants.slice(0, 5);

  return (
    <div className="w-full max-w-md">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
          Recent Drops
        </h3>
        {submissionCount > displayed.length && (
          <Link
            href={variantsHref}
            className="text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors"
          >
            View All ({submissionCount})
          </Link>
        )}
      </div>

      {displayed.length === 0 ? (
        <p className="text-sm text-zinc-600 py-6 border-t border-zinc-800/50">
          No recorded drops for this item.
        </p>
      ) : (
        <div className="divide-y divide-zinc-800/60 border-t border-zinc-800/60">
          {displayed.map((variant) => {
            const href = `/items/${itemId}/drops/${variant.submissionId}`;
            const displayName = variant.submittedBy ?? 'Anonymous';

            return (
              <div
                key={variant.submissionId}
                className="group flex items-center gap-4 py-2 hover:pl-1 transition-all duration-200"
              >
                {/* Left Aligned Circle Indicator */}
                <div className="shrink-0">
                  <div className="h-2 w-2 rounded-full bg-zinc-800 group-hover:bg-orange-500 group-hover:ring-4 group-hover:ring-orange-500/10 transition-all duration-300" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                      {displayName}
                    </span>
                    <time
                      className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400"
                      dateTime={variant.submittedAt}
                    >
                      {formatSubmittedAt(variant.submittedAt, { relativeWithinHours: 24 })}
                    </time>
                  </div>
                </div>

                <Link
                  href={href}
                  className={`
                    ml-4 shrink-0 text-[11px] font-bold uppercase tracking-wider
                    text-orange-500 hover:text-white 
                    bg-orange-500/5 hover:bg-orange-600 
                    border border-orange-500/20 hover:border-orange-600 
                    rounded px-3 py-1.5 transition-all duration-200
                  `}
                  aria-label={`View drop by ${displayName}`}
                >
                  View
                </Link>
                
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};