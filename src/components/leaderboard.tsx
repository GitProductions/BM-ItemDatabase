'use client';

import React, { useEffect, useMemo, useState } from 'react';

type LeaderboardEntry = {
  name: string;
  submissionCount: number;
  itemCount?: number;
  lastSubmittedAt?: string;
};

type LeaderboardTotals = {
  submissions: number;
  distinctItems: number;
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totals, setTotals] = useState<LeaderboardTotals>({ submissions: 0, distinctItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/leaderboard?limit=25', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setEntries(data?.submitters ?? []);
        setTotals(data?.totals ?? { submissions: 0, distinctItems: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const totalSubmissions = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.submissionCount ?? 0), 0),
    [entries],
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-orange-300">Hall of the Lost</p>
          <h2 className="text-lg font-semibold text-white">Top Contributors</h2>
        </div>
        <div className="text-right text-xs text-zinc-400 space-y-1">
          {/* <div className="flex flex-col">
            <span>Total submissions</span>
            <span className="text-xl font-bold text-orange-400">{totals.submissions || totalSubmissions}</span>
          </div> */}
          <div className="flex flex-col">
            <span>Submitted items</span>
            <span className="text-sm font-semibold text-zinc-200">{totals.distinctItems}</span>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-zinc-500">Counting entries...</div>}
      {error && (
        <div className="text-sm text-red-400">
          Could not load leaderboard: {error}. Try again later.
        </div>
      )}

      {!loading && !error && (
        <ol className="space-y-2">
          {entries.map((entry, idx) => (
            <li
              key={entry.name}
              className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 hover:border-orange-500/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-200 font-semibold grid place-items-center">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-white">{entry.name || 'Unknown'}</div>
                  <div className="text-[11px] text-zinc-500">
                    {entry.itemCount ? `${entry.itemCount} items touched` : '—'} • Last: {formatDate(entry.lastSubmittedAt)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-400">Submissions</div>
                <div className="text-lg font-bold text-orange-400">{entry.submissionCount}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
