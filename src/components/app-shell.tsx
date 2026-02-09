"use client";

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useAppData } from '@/components/app-provider';
import Image from "next/image";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, totalCount } = useAppData();

  return (
    <div className="relative h-[100dvh] min-h-0 bg-zinc-950 text-zinc-200 font-sans selection:bg-orange-500/30">

      <div className="pointer-events-none fixed left-1/2 top-2/3 z-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
        <Image
          src="/bm-logo.webp"
          alt="Background Logo"
          width={600}
          height={900}
          loading="eager"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <Header loading={loading} totalCount={totalCount} />
        <main className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-4 space-y-6">
              {loading ? (
                <div className="space-y-4 animate-pulse min-h-[70vh]" aria-busy="true">
                  <div className="rounded-xl bg-zinc-800/60" />

                </div>
              ) : (
                children
              )}
            </div>
          </div>
          <Footer />
        </main>
        
      </div>
    </div>
  );
}
