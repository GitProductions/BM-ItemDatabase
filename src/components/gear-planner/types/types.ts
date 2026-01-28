import { Item } from '@/types/items';
import { SlotKey, SlotConfig } from '@/lib/slots';


export type GearPlannerProps = {
  items: Item[];
};

export type Selected = Record<SlotKey, Item | null>;

export type { SlotKey, SlotConfig };


