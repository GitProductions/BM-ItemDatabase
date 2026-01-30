import React from 'react'
import Image from 'next/image'


function ConfirmDialog({ resetOrcLine, confirmReset, cancelReset }) {
  return (
    <>
         
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-500/10 via-orange-400/5 to-transparent" />
            <div className="relative space-y-4 p-6 text-center">
              <Image
                src="/no-results.png"
                alt="Sassy half-orc"
                width={180}
                height={180}
                className="mx-auto drop-shadow-lg"
                priority
              />
              <p className="text-sm text-amber-100">{resetOrcLine}</p>
              <p className="text-xs text-zinc-400">Reset all equipped items and start fresh?</p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={confirmReset}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-900/50 transition hover:bg-orange-500"
                >
                  Yes, reset
                </button>
                <button
                  onClick={cancelReset}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                >
                  Keep my gear
                </button>
              </div>
            </div>
          </div>
        </div>
   
      </>
  )
}

export default ConfirmDialog