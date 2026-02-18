import { formatSubmittedAt } from '@/lib/format-submitted-at';
import { ItemHeaderBadges } from '@/components/item-details/ItemHeaderBadges';

type OriginalDropMetaProps = {
  submittedAt: string;
  submittedBy?: string;
  showSubmitter?: boolean;
};

export const OriginalDropMeta = ({ submittedAt, submittedBy, showSubmitter = false }: OriginalDropMetaProps) => (

  <ItemHeaderBadges isMergedView={false} asRow align="left">

    {/* The submitter Label / Mention */}
    {showSubmitter ? (
      <>
        <span className="text-zinc-200">{submittedBy ?? 'Unknown'}</span>
        <span className="px-2 text-zinc-600">•</span>
      </>
    ) : null}
    <span>{formatSubmittedAt(submittedAt)}</span>

  </ItemHeaderBadges>
);
