"use client";

import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import Button from '@/components/ui/Button';
import UserIcon from '@/components/ui/UserIcon';
import { Pencil } from 'lucide-react';

type ProfileHeaderProps = {
  session: Session;
  update?: (data?: { name?: string }) => Promise<unknown>;
  onSignOut: () => void;
};

export default function ProfileHeader({ session, update, onSignOut }: ProfileHeaderProps) {
  const [displayName, setDisplayName] = useState(session.user?.name ?? '');
  const [nameEditing, setNameEditing] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(session.user?.name ?? '');
  }, [session.user?.name]);

  const handleNameSave = async () => {
    if (!displayName.trim()) return;
    setNameEditing(false);
    setNameSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: displayName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Unable to update name');
      }
      if (update) {
        await update({ name: displayName });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update name');
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div>
        <p className="text-sm text-zinc-400">Signed in as</p>
        <div className="mt-1 mb-3 grid grid-cols-[auto,1fr] items-center gap-4">
          <UserIcon session={session} />

          <div>
            {nameEditing ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={nameSaving}
                />
                <Button onClick={handleNameSave} disabled={nameSaving} variant="primary">
                  {nameSaving ? 'Savingâ€¦' : 'Save'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold text-white">{session.user?.name || session.user?.email}</p>
                <Button
                  variant="secondary"
                  className="ms-2 p-1 text-sm rounded-md text-zinc-400 hover:underline"
                  onClick={() => setNameEditing(true)}
                >
                  <Pencil size={12} className="inline mb-0.5 " />
                </Button>
              </div>
            )}

            <p className="text-sm text-zinc-500">{session.user?.email}</p>

            {session?.user?.isAdmin && (
              <p className="text-sm text-emerald-400">Admin</p>
            )}

            {error ? (
              <p className="mt-2 text-xs text-rose-300">{error}</p>
            ) : null}
          </div>
        </div>
      </div>
      <Button variant="danger" onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
}
