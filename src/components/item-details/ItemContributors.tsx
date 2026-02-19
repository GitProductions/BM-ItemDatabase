type ItemContributorsProps = {
  primarySubmitter: string;
  extraSubmitters: string[];
};

export const ItemContributors = ({ primarySubmitter, extraSubmitters }: ItemContributorsProps) => (
  <div className="card-section">

    <h2 className="text-sm font-semibold text-white">Contributors</h2>

    {/* Primary Contributor Label */}
    <p className="text-sm text-zinc-300">
      Primary: <span className="text-white">{primarySubmitter}</span>
    </p>

    {/* Showing extra contributors/submitters if available */}
    {extraSubmitters.length ? (
      <div className="flex flex-wrap gap-2">
        {extraSubmitters.map((name) => (
          <span key={name} className="badge-tag">
            {name}
          </span>
        ))}

      </div>
    ) : (
      <p className="text-sm text-zinc-500">No additional contributors listed.</p>
    )}
  </div>
);
