import Link from 'next/link';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';
import Image from 'next/image';

export default function PageNotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center  ">
      <div className="w-full max-w-2xl text-center space-y-10">

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Page Not Found
        </h1>

        {/* Orc section with buttons on left + right */}
        <div className="relative flex flex-col items-center gap-6 mt-8">

          <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 md:-translate-x-full z-10 hidden md:block">
            <Link
              href="/add-item"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/90 px-5 py-3 text-sm font-medium text-zinc-100 hover:border-orange-600 hover:bg-zinc-700 transition-all shadow-lg backdrop-blur-sm whitespace-nowrap"
            >
              Submit an Item
            </Link>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 md:translate-x-full z-10 hidden md:block">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/90 px-5 py-3 text-sm font-medium text-zinc-100 hover:border-orange-600 hover:bg-zinc-700 transition-all shadow-lg backdrop-blur-sm whitespace-nowrap"
            >
              Back to Home
            </Link>
          </div>

          <div className="flex flex-col items-center">
            <Image
              src="/no-results.png"
              alt="Orc Shrug"
              width={340}
              height={340}
              className="mx-auto drop-shadow-xl"
              priority
            />
            <p className="mt-5 text-lg md:text-xl text-zinc-300 font-medium max-w-lg">
              {getRandomOrcPhrase("pageNotFound", "random")}
            </p>
          </div>

        </div>

        {/* Mobile fallback buttons – shown only on small screens */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 md:hidden">
          <Link
            href="/add-item"
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-6 py-3 text-base font-medium text-zinc-100 hover:border-orange-600 hover:bg-zinc-700 transition-colors"
          >
            Submit an Item
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 px-6 py-3 text-base font-medium text-zinc-100 hover:border-orange-600 hover:bg-zinc-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}