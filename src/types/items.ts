export type AffectType = 'spell' | 'stat';

export interface ItemAffect {
  type: AffectType;
  stat?: string;
  value?: number;
  spell?: string;
  level?: number;
}

export interface ItemStats {
  affects: ItemAffect[];
  damage?: string;
  ac?: number;
  weight?: number;
}

export interface Item {
  id: string;
  name: string;
  keywords: string;
  type: string;
  flags: string[];
  stats: ItemStats;
  raw?: string[];
}
