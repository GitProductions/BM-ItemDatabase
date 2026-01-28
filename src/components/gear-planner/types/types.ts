import { Item } from '@/types/items';

export type SlotKey =
  | 'head'
  | 'neck1'
  | 'neck2'
  | 'body'
  | 'about-legs'
  | 'legs'
  | 'feet'
  | 'hands'
  | 'waist'
  | 'finger1'
  | 'finger2';



export type SlotConfig = {
  key: SlotKey;
  label: string;
  hint: string;
};


export type GearPlannerProps = {
  items: Item[];
};

export type Selected = Record<SlotKey, Item | null>;


