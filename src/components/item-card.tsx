import React from 'react';
import { Database, Feather, Scroll, Shield, Sparkles, Sword } from 'lucide-react';
import { Item } from '@/types/items';
import { StatBadge } from './stat-badge';

type ItemCardProps = {
  item: Item;
};

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  let Icon = Database;
  let typeColor = 'text-zinc-400';

  const stats = item.stats ?? { affects: [], weight: 0 };
  const affects = stats.affects ?? [];

  if (item.type.includes('weapon')) {
    Icon = Sword;
    typeColor = 'text-red-400';
  } else if (item.type.includes('armor')) {
    Icon = Shield;
    typeColor = 'text-blue-400';
  } else if (item.type.includes('scroll') || item.type.includes('wand')) {
    Icon = Scroll;
    typeColor = 'text-purple-400';
  } else if (item.type.includes('light')) {
    Icon = Sparkles;
    typeColor = 'text-yellow-400';
  } else if (item.type.includes('worn')) {
    Icon = Feather;
    typeColor = 'text-green-400';
  }

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 hover:border-zinc-500 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-md bg-zinc-900 ${typeColor}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{item.name}</h3>
            <div className="text-xs text-zinc-500 mt-1 font-mono">
              {item.keywords} • <span className="uppercase text-zinc-400">{item.type}</span>
            </div>
            {stats.condition && (
              <div className="text-[10px] uppercase text-zinc-500 mt-1 tracking-wide">{stats.condition}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          {item.isArtifact && (
          <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
             {item.isArtifact ? 'Artifact: Yes' : undefined}
          </span>
          )}

        </div>
      </div>

      <div className="mb-3 mt-3 flex flex-wrap">
        {stats.weight !== undefined && ( <StatBadge label="Weight" value={stats.weight.toString()} color="bg-yellow-900/50 border border-yellow-800" />)}
        {stats.damage && <StatBadge label="Damage" value={stats.damage} color="bg-red-900/50 border border-red-800" />}
        {stats.ac !== undefined && <StatBadge label="AC" value={stats.ac} color="bg-blue-900/50 border border-blue-800" />}

        {item.flags.map((flag) => (
          <span
            key={flag}
            className="text-[10px] uppercase border border-zinc-600 text-zinc-400 px-1.5 py-0.5 rounded mr-1 mb-1"
          >
            {flag}
          </span>
        ))}
      </div>

      {affects.length > 0 && (
        <div className="bg-zinc-900/50 rounded p-2 text-sm border-l-2 border-orange-600">
          <div className="text-[10px] uppercase text-zinc-500 mb-1 font-bold">Affects</div>
          <ul className="space-y-1">
            {affects.map((affect, index) => (
              <li key={`${affect.type}-${index}`} className="flex justify-between text-zinc-300 font-mono text-xs">
                {affect.type === 'spell' ? (
                  <>
                    <span>
                      Cast: <span className="text-purple-300">{affect.spell}</span>
                    </span>
                    <span>Lvl {affect.level}</span>
                  </>
                ) : (
                  <>
                    <span className="capitalize">{affect.stat}</span>
                    <span className={(affect.value ?? 0) >= 0 ? 'text-orange-400' : 'text-red-400'}>
                      {(affect.value ?? 0) > 0 ? '+' : ''}
                      {affect.value}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
