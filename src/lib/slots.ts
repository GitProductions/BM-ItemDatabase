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
  | 'finger2'
  | 'wield'
  | 'offhand'
  | 'held'
  | 'two-handed'
  | 'back'
  | 'floating'
  | 'light';

export type SlotConfig = {
  key: SlotKey;
  label: string;
  hint?: string;
};

export const SLOT_CONFIG: SlotConfig[] = [
  { key: 'head', label: 'Head', hint: 'helms, caps' },
  { key: 'neck1', label: 'Neck', hint: 'amulets, chains' },
  { key: 'neck2', label: 'Neck', hint: 'amulets, chains' },
  { key: 'body', label: 'Body', hint: 'robes, chestplates' },
  { key: 'about-legs', label: 'About Legs', hint: 'kilts, wraps' },
  { key: 'legs', label: 'Legs', hint: 'greaves, leggings' },
  { key: 'feet', label: 'Feet', hint: 'boots, shoes' },
  { key: 'hands', label: 'Hands', hint: 'gloves, gauntlets' },
  { key: 'waist', label: 'Waist', hint: 'belts, sashes' },
  { key: 'finger1', label: 'Ring', hint: 'rings, bands' },
  { key: 'finger2', label: 'Ring', hint: 'rings, bands' },
  { key: 'wield', label: 'Wield', hint: 'weapons, staves' },
  { key: 'offhand', label: 'Offhand', hint: 'shields, offhand' },
  { key: 'held', label: 'Held', hint: 'lanterns, books' },
  { key: 'two-handed', label: 'Two-handed', hint: 'greatswords, polearms' },
  { key: 'back', label: 'Back', hint: 'quivers, cloaks' },
  { key: 'light', label: 'Light', hint: 'lights' },

  // scrolls, wands & potions are not included yet, they are not wearable so need a special flag so its not used in equipment manager
  
];

// Keywords associated with each slot for guessing
const slotKeywords: Record<SlotKey, string[]> = {
  head: ['helm', 'hood', 'cap', 'hat', 'crown'],
  neck1: ['amulet', 'torc', 'necklace', 'pendant', 'gorget'],
  neck2: ['amulet', 'torc', 'necklace', 'pendant', 'gorget'],
  body: ['robe', 'breastplate', 'chest', 'armor'],
  'about-legs': ['kilt', 'skirt'],
  legs: ['greaves', 'leggings', 'pants'],
  feet: ['boots', 'shoes', 'slippers', 'sabatons'],
  hands: ['glove', 'gauntlet', 'mitt'],
  waist: ['belt', 'sash', 'cord'],
  finger1: ['ring', 'band'],
  finger2: ['ring', 'band'],
  wield: ['sword', 'axe', 'mace', 'flail', 'staff', 'club', 'dagger'],
  offhand: ['shield', 'buckler'],
  held: [ 'book', 'tome', 'orb'],
  'two-handed': ['greatsword', 'polearm', 'halberd', 'maul'],
  back: ['quiver', 'cloak', 'cape'],
  light: ['light', 'lantern',]
};

export const guessSlot = (item: { keywords?: string; name?: string; worn?: string }): SlotKey | undefined => {
  if (item.worn) return item.worn as SlotKey;

  const haystack = `${item.name ?? ''} ${item.keywords ?? ''}`.toLowerCase();
  for (const [slot, keys] of Object.entries(slotKeywords) as [SlotKey, string[]][]) {
    if (keys.some((k) => haystack.includes(k))) return slot;
  }
  return undefined;
};
