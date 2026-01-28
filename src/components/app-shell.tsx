"use client";

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useAppData } from '@/components/app-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { items, loading } = useAppData();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-orange-500/30">
      <Header items={items} loading={loading} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 min-h-[90dvh] overflow-auto">
        {loading ? (
         <div className="space-y-4 animate-pulse min-h-[70vh]" aria-busy="true">
          <div className="rounded-xl bg-zinc-800/60" />

          {/* <div className="relative flex justify-center">
            <Image
              src="/no-results.png"
              alt="Loading..."
              width={500}
              height={500}
              loading="eager"
              priority
              className="flex"
            />
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-black bg-white w-[40%] py-2 px-5">
              <span className="font-bold">The half-orc says:</span> Please wait while I fetch the things...
            </p>
          </div> */}
        </div>

        ) : (
          children
        )}
      </main>
      <Footer />
    </div>
  );
}
