"use client";

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useAppData } from '@/components/app-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { items } = useAppData();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-orange-500/30">
      <Header items={items} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 min-h-[80dvh]">{children}</main>
      <Footer />
    </div>
  );
}
