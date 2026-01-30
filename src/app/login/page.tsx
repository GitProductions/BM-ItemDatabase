"use client";

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';

// Do we add a password reset page?
// or lets add discord as an auth provider since all users will likely be joining BM discord and have a user account there?
// this would make it easier overall and no need for us to send emails then?
// this way I dont thnk we will need to ever do a forgot password system technically as it would be on them?  

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [orcLine, setOrcLine] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    setOrcLine(null);

    try {
      if (mode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, name, password }),
        });

        if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message ?? 'Unable to register');
      }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error);
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setStatus(message);
      setOrcLine(getRandomOrcPhrase('invalidSubmission', 'random'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p className="text-sm text-zinc-400">
            Use your account to auto-fill submissions, manage items, and get API tokens.
          </p>
        </div>
        <Button
          type="button"
          className="text-xs px-3 py-2"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setStatus(null);
          }}
        >
          {mode === 'login' ? 'Need an account?' : 'Already registered?'}
        </Button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="space-y-1">
            <label className="text-sm text-zinc-200">Display name</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Jaela"
              required
              disabled={busy}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm text-zinc-200">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            disabled={busy}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-200">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            disabled={busy}
            minLength={8}
          />
        </div>

        {status ? (
          <div className="rounded-lg border border-rose-800 bg-rose-900/30 px-4 py-3 space-y-2">
            <div className="flex items-start gap-3">
              <Image
                src="/no-results.png"
                alt="Half-orc disapproves"
                width={64}
                height={64}
                className="rounded-md border border-rose-800/60 bg-rose-950"
              />
              <div className="space-y-1">
                <p className="text-sm text-rose-200 font-semibold">Login failed</p>
                <p className="text-sm text-rose-300">{status}</p>
                {orcLine ? <p className="text-xs text-rose-200/90 font-mono">{orcLine}</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        <Button type="submit" disabled={busy} className="w-full justify-center">
          {busy ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account & sign in'}
        </Button>
      </form>
    </div>
  );
}
