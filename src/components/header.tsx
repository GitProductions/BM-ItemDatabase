
import {  Plus, Search } from 'lucide-react';
import Image from 'next/image';


function Header( {items, view, setView}: {items: any[], view: string, setView: (view: any) => void}) {
  return (
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className=" p-2 rounded text-white ">
     
              <Image className="shadow-lg shadow-orange-900/50" src="/bm-logo.png" alt="Logo" width={24} height={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">BlackMUD Item DB</h1>
              <p className="text-xs text-zinc-400 font-mono">{items.length} artifacts indexed</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('db')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2  ${
                view === 'db'
                  ? 'bg-zinc-800 text-orange-400 border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Search size={16} /> Database
            </button>
            <button
              onClick={() => setView('import')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                view === 'import'
                  ? 'bg-zinc-800 text-orange-400 border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Plus size={16} /> Add Data
            </button>
          </div>
        </div>
      </header>
  )
}

export default Header;