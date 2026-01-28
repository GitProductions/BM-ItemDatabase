import React from 'react';
import Link from 'next/link';

function Footer() {
  return (
    <footer className="w-full border-t border-zinc-700 mt-8 pb-2 text-center text-xs text-zinc-500 bg-zinc-900">
      <div className="space-x-4 p-2">
        <Link href="/" className="hover:underline hover:text-orange-600">
          Home
        </Link>
        <Link href="/gear-planner" className="hover:underline hover:text-orange-600">
          Gear Planner
        </Link>
        <Link href="/add-item" className="hover:underline hover:text-orange-600">
          Add Items
        </Link>
        <Link href="/about" className="hover:underline hover:text-orange-600">
          About
        </Link>
      </div>

      <p className="mt-2">Created by David &quot;Gitago&quot; Bell with love.</p>
    </footer>
  );
}

export default Footer;
