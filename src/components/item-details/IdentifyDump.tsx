type IdentifyDumpProps = {
  raw?: string[];
  title?: string;
  summaryLabel?: string;
  collapsible?: boolean;
};

const defaultTitle = 'Identify dump';

const dumpBody = (raw: string[]) => (
  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-emerald-100">
    {raw.join('\n')}
  </pre>
);

export const IdentifyDump = ({ raw, title = defaultTitle, summaryLabel = defaultTitle, collapsible = false }: IdentifyDumpProps) => {
  if (!raw?.length) return null;

  if (collapsible) {
    return (
      <details className="rounded-lg border border-zinc-800 bg-black/50 p-3 text-sm text-emerald-100">
        <summary className="cursor-pointer text-xs text-zinc-400">{summaryLabel}</summary>
        <div className="mt-2">
          {dumpBody(raw)}
        </div>
      </details>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="rounded-lg border border-zinc-800 bg-black/50 p-3">
        {dumpBody(raw)}
      </div>
    </section>
  );
};
