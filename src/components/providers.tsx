"use client";

import { SessionProvider } from 'next-auth/react';
import { AppDataProvider } from '@/components/app-provider';
import { AppShell } from '@/components/app-shell';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppDataProvider>
        <AppShell>{children}</AppShell>
      </AppDataProvider>
    </SessionProvider>
  );
}
