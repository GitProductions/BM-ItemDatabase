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

// todo: 
// strip hum or glow conditions
// ..They glow blue
// ..They glow softly
// ..It hums powerfully
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
    const rawName = i > 0 ? lines[i - 1] : 'Unknown Item';
    const { label: name, condition } = stripCondition(rawName);

    const currentItem: Item = {
      id: generateId(),
      name,
      keywords,
      type,
      flags: [],
      stats: {
        weight: 0,
        affects: [],
        condition,
      },
      raw: [],
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
      }

      currentItem.raw?.push(nextLine);
      j += 1;
    }

    items.push(currentItem);
  }

  return items;
};
