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
  | 'wrist1'
  | 'wrist2'
  | 'wield'
  | 'offhand'
  | 'held'
  | 'two-handed'
  | 'back'
  | 'light'
  | 'consumable';

export type SlotConfig = {
  key: SlotKey;
  label: string;
  hint?: string;
};

export const canonicalSlot = (slot: SlotKey) => {
  if (slot.startsWith('neck')) return 'neck1';
  if (slot.startsWith('finger')) return 'finger1';
  if (slot.startsWith('wrist')) return 'wrist1';
  return slot;
};

export const normalizeWornSlots = (worn?: string[] | string | null): SlotKey[] => {
  if (!worn) return [];
  const raw = Array.isArray(worn) ? worn : worn.split(',');
  const normalized = raw
    .map((slot) => slot.trim().toLowerCase())
    .filter((slot) => slot.length > 0) as SlotKey[];
  return Array.from(new Set(normalized));
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
  { key: 'wrist1', label: 'Wrist', hint: 'bracelets, cuffs' },
  { key: 'wrist2', label: 'Wrist', hint: 'bracelets, cuffs' },
  { key: 'wield', label: 'Wield', hint: 'weapons, staves' },
  { key: 'offhand', label: 'Offhand', hint: 'shields, offhand' },
  { key: 'held', label: 'Held', hint: 'lanterns, books' },
  { key: 'two-handed', label: 'Two-handed', hint: 'greatswords, polearms' },
  { key: 'back', label: 'Back', hint: 'quivers, cloaks' },
  { key: 'light', label: 'Light', hint: 'lights' },
];

// Options list for selects (includes consumable)
export const SLOT_OPTIONS: SlotConfig[] = [
  ...SLOT_CONFIG,
  { key: 'consumable', label: 'Consumable', hint: 'scroll / wand / potion' },
];

// Keywords associated with each slot for guessing
const slotKeywords: Record<SlotKey, string[]> = {
  head: ['helm', 'hood', 'cap', 'hat', 'crown'],
  neck1: ['amulet', 'torc', 'necklace', 'pendant'],
  neck2: ['amulet', 'torc', 'necklace', 'pendant'],
  body: ['robe', 'breastplate', 'chest', 'armor'],
  'about-legs': ['kilt', 'skirt'],
  legs: ['greaves', 'leggings', 'pants'],
  feet: ['boots', 'shoes', 'slippers'],
  hands: ['glove', 'gauntlet'],
  waist: ['belt', 'sash', 'cord'],
  finger1: ['ring', 'band'],
  finger2: ['ring', 'band'],
  wrist1: ['bracelet', 'bracer', 'bangle'],
  wrist2: ['bracelet', 'bracer', 'bangle'],
  wield: ['sword', 'axe', 'mace', 'flail', 'staff', 'club', 'dagger'],
  offhand: ['shield', 'buckler'],
  held: [ 'book', 'tome', 'orb'],
  'two-handed': ['greatsword', 'polearm', 'halberd', 'maul'],
  back: ['quiver', 'cloak', 'cape'],
  light: ['light', 'lantern'],
  consumable: ['scroll', 'wand', 'potion', 'elixir'],

};

export const guessSlot = (item: { keywords?: string; name?: string; worn?: string[] | string | null }): SlotKey | undefined => {
  const wornSlots = normalizeWornSlots(item.worn);
  if (wornSlots.length) return wornSlots[0];

  const haystack = `${item.name ?? ''} ${item.keywords ?? ''}`.toLowerCase();
  if (haystack.match(/\b(scroll|wand|potion|elixir)\b/)) return 'consumable';
  for (const [slot, keys] of Object.entries(slotKeywords) as [SlotKey, string[]][]) {
    if (keys.some((k) => haystack.includes(k))) return slot;
  }
  return undefined;
};

const NON_EQUIPPABLE: SlotKey[] = ['consumable'];
export const isWearable = (item: { worn?: string[] | string | null; type?: string }): boolean => {
  const wornSlots = normalizeWornSlots(item.worn);
  if (wornSlots.length) return wornSlots.some((slot) => !NON_EQUIPPABLE.includes(slot));

  const haystack = `${item.type ?? ''}`.toLowerCase();
  return !NON_EQUIPPABLE.some((slot) => haystack.includes(slot));
};

export const matchesSlot = (
  item: { keywords?: string; name?: string; worn?: string[] | string | null; type?: string },
  target: SlotKey,
): boolean => {
  const wornSlots = normalizeWornSlots(item.worn);
  if (wornSlots.length) return wornSlots.some((slot) => canonicalSlot(slot) === canonicalSlot(target));

  const guess = guessSlot(item);
  if (!guess) return true; // keep unclassified items visible across slots
  return canonicalSlot(guess) === canonicalSlot(target);
};
