
import { Plus, Search, Sparkles, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Item } from '@/types/items';

type AppView = 'db' | 'import' | 'gear';

type NavButtonsProps = {
  view: AppView;
  setView: (view: AppView) => void;
  onDone?: () => void;
};

function NavButtons({ view, setView, onDone }: NavButtonsProps) {
  return (
    <>
      <button
        onClick={() => {
          setView('db');
          onDone?.();
        }}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
          view === 'db' ? 'bg-zinc-800 text-orange-400 border border-zinc-700' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Search size={16} /> Items
      </button>
      <button
        onClick={() => {
          setView('gear');
          onDone?.();
        }}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
          view === 'gear' ? 'bg-zinc-800 text-orange-400 border border-zinc-700' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Sparkles size={16} /> Equipment
      </button>
      <button
        onClick={() => {
          setView('import');
          onDone?.();
        }}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
          view === 'import' ? 'bg-zinc-800 text-orange-400 border border-zinc-700' : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Plus size={16} /> Add Items
      </button>
    </>
  );
}

function Header({ items, view, setView }: { items: Item[]; view: AppView; setView: (view: AppView) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleClickAway = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [mobileOpen]);

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded text-white">
            <Image className="shadow-lg shadow-orange-900/50" src="/bm-logo.png" alt="Logo" width={24} height={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">BlackMUD Item DB</h1>
            <p className="text-xs text-zinc-400 font-mono">{items.length} items indexed</p>
          </div>
        </div>

        <div className="hidden md:flex gap-2">
          <NavButtons view={view} setView={setView} />
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden text-zinc-100 p-2 rounded hover:bg-zinc-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
          <div ref={panelRef} className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
            <NavButtons view={view} setView={setView} onDone={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
