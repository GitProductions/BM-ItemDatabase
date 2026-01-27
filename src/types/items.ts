export type AffectType = 'spell' | 'stat';

export interface ItemAffect {
  type: AffectType;
  stat?: string;
  value?: number;
  spell?: string;
  level?: number;
}

export interface ItemStats {
  damage?: string;
  ac?: number;
}

export interface Item {
  id: string;
  name: string;
  keywords: string;
  type: string;
  weight: number;
  flags: string[];
  stats: ItemStats;
  affects: ItemAffect[];
  raw?: string[];
}
