type ItemTraitsFlagsProps = {
  flags: string[];
  ego?: string;
  egoMin?: string;
  egoMax?: string;
};

export const ItemTraitsFlags = ({ flags, ego, egoMin, egoMax }: ItemTraitsFlagsProps) => (
  <div className="card-section">

    <h2 className="text-sm font-semibold text-white">Traits & Flags</h2>

    <div className="flex flex-wrap gap-2">

    {/* Item Flags */}
      {flags.length ? (
        flags.map((flag) => (
          <span key={flag} className="text-[11px] uppercase border border-zinc-700 text-zinc-200 px-2 py-1 rounded-md">
            {flag}
          </span>
        ))

      ) : (
        <p className="text-sm text-zinc-500">No flags recorded.</p>
      )}
    </div>

    {/* Item Ego Label  - only showing egoMax if egoMin is different*/}
    {ego && egoMin ? <p className="text-sm text-zinc-300">Ego: {egoMin} {egoMax && egoMin !== egoMax ? ` / ${egoMax}` : ''}</p> : null  }

  </div>
);
