import { Item, ItemAffect } from '@/types/items';

const objectLineRegex = /Object '([^']+)', Item type: (.+)/;

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const parseStatAffect = (line: string): ItemAffect | null => {
  const statMatch = line.match(/Type:\s+(.+?)\s+Value:\s+(-?\d+)/i);
  if (!statMatch) return null;

  return {
    type: 'stat',
    stat: statMatch[1].trim(),
    value: Number(statMatch[2]),
  };
};

const parseSpellAffect = (line: string): ItemAffect => {
  const spellMatch = line.match(/Spell:\s+(\S+)/i);
  const levelMatch = line.match(/Level:\s+(\d+)/i);

  return {
    type: 'spell',
    spell: spellMatch?.[1],
    level: levelMatch ? Number(levelMatch[1]) : undefined,
  };
};


// strip hum or glow conditions
const nameDescriptorRegex = /(.*?)\s*\(([^)]+)\)\s*$/;
const descriptorLineRegex = /^\.\.(.+)$/;
const descriptorSuffixRegex = /(\.\.[^.]+)+$/g;

const stripCondition = (value: string) => {
  const cleanedValue = value.replace(descriptorSuffixRegex, '').trim();
  const match = cleanedValue.match(nameDescriptorRegex);
  if (!match) {
    return { label: cleanedValue, condition: undefined };
  }

  return { label: match[1].trim(), condition: match[2].trim() };
};

// discard/filter stats/effects for enchanted items
// if item has Armor +1 +2 or +3 and has a Save_all -1, -2, -3 effect, then we can assume this is an enchanted item
// There is no need to share 'enchanted' info for the user.

const isArmorEnchant = (affect: ItemAffect) =>
  affect.type === 'stat' &&
  affect.stat?.toLowerCase().includes('armor') &&
  (affect.value === 1 || affect.value === 2 || affect.value === 3);

const isSaveAllEnchant = (affect: ItemAffect) =>
  affect.type === 'stat' &&
  affect.stat?.toLowerCase() === 'save_all' &&
  (affect.value === -1 || affect.value === -2 || affect.value === -3);

export const filterEnchanted = (affects: ItemAffect[]): boolean => {
  const armorAffects = affects.filter(isArmorEnchant);
  const saveAllAffects = affects.filter(isSaveAllEnchant);
  return armorAffects.length > 0 && saveAllAffects.length > 0;
};

/**
 * Detects potential duplicates by comparing identity *and* stats.
 * We now treat an item as a duplicate only when the core identity AND stats match,
 * so variants with the same keywords/name/type but differing rolls are allowed through.
 */
export const findDuplicate = (newItem: Item, existingItems: Item[]): string | undefined => {
  const normalize = (text?: string) => (text ?? '').toLowerCase().trim();

  return existingItems.find((existing) => {
    const sameIdentity =
      normalize(existing.name) === normalize(newItem.name) &&
      normalize(existing.keywords) === normalize(newItem.keywords) &&
      normalize(existing.type) === normalize(newItem.type);

    if (!sameIdentity) return false;

    // Deep compare stats + flags to decide if it's truly the same record
    const sameFlags = JSON.stringify(existing.flags ?? []) === JSON.stringify(newItem.flags ?? []);
    const sameStats = JSON.stringify(existing.stats ?? {}) === JSON.stringify(newItem.stats ?? {});
    const sameEgo = normalize(existing.ego) === normalize(newItem.ego);
    const sameArtifact = Boolean(existing.isArtifact) === Boolean(newItem.isArtifact);

    return sameFlags && sameStats && sameEgo && sameArtifact;
  })?.id;
};

export const parseIdentifyDump = (text: string): Item[] => {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !descriptorLineRegex.test(line));

  const items: Item[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(objectLineRegex);
    if (!match) continue;

    const keywords = match[1];
    const type = match[2].trim().toLowerCase();
    const hasNameLine = i > 0 && !objectLineRegex.test(lines[i - 1]);
    const rawName = hasNameLine ? lines[i - 1] : '';
    const { label: name, condition } = stripCondition(rawName || 'Unknown Item');
    

    const currentItem: Item = {
      id: generateId(),
      name,
      nameMissing: !hasNameLine,
      keywords,
      type,
      flags: [],
      stats: {
        weight: 0,
        affects: [],
        condition,
      },
      raw: [],
      submittedBy: undefined,
      droppedBy: undefined,
      worn: undefined,
    };

    let j = i + 1;
    while (j < lines.length) {
      const nextLine = lines[j];
      if (nextLine.match(objectLineRegex)) break;

      if (nextLine.startsWith('Weight:')) {
        currentItem.stats.weight = parseInt(nextLine.replace('Weight:', '').trim(), 10) || 0;
      } else if (nextLine.startsWith('Item is:')) {
        const flagsStr = nextLine.replace('Item is:', '').trim();
        if (flagsStr !== 'NOBITS') {
          currentItem.flags = flagsStr.split(',').map((flag) => flag.trim());
        }
      } else if (nextLine.startsWith("Damage Dice is")) {
        const diceMatch = nextLine.match(/'([^']+)'/);
        if (diceMatch) currentItem.stats.damage = diceMatch[1];
      } else if (nextLine.startsWith('AC-apply is')) {
        const acValue = parseInt(nextLine.replace('AC-apply is', '').trim(), 10);
        currentItem.stats.ac = Number.isNaN(acValue) ? undefined : acValue;
      } else if (nextLine.startsWith('Type:')) {
        if (nextLine.includes('Spell:')) {
          currentItem.stats.affects.push(parseSpellAffect(nextLine));
        } else {
          const statAffect = parseStatAffect(nextLine);
          if (statAffect) currentItem.stats.affects.push(statAffect);
        }
      } else if (nextLine.includes("This item's ego")) {
        const egoMatch = nextLine.match(/This item's ego is of\s+(.+)/i);
        if (egoMatch) {
          currentItem.ego = egoMatch[1];
        }
      }

      currentItem.raw?.push(nextLine);
      j += 1;
    }

    // If the affects indicate an enchanted item (last entries), strip the enchant-only lines but keep other stats
    if (filterEnchanted(currentItem.stats.affects)) {
      currentItem.stats.affects = currentItem.stats.affects.filter(
        (affect) => !isArmorEnchant(affect) && !isSaveAllEnchant(affect),
      );
    }

    items.push(currentItem);
  }

  return items;
};
