import { Item } from '@/types/items';
import { Selected } from './types/types';

export const normalize = (text: string) => text.toLowerCase();

export const computeTotals = (selected: Selected) => {
  const selectedItems = Object.values(selected).filter(Boolean) as Item[];

  const totalWeight = selectedItems.reduce((sum, item) => sum + (item.stats?.weight ?? 0), 0);

  const totalAC =
    selectedItems.reduce((sum, item) => sum + (item.stats?.ac ?? 0), 0) +
    selectedItems.reduce((sum, item) => {
      const acAffects = item.stats?.affects?.filter(
        (affect) => affect.type === 'stat' && normalize(affect.stat ?? '') === 'ac',
      );
      return (
        sum +
        (acAffects?.reduce((innerSum, affect) => innerSum + (affect.value ?? 0), 0) ?? 0)
      );
    }, 0);

  const affectsTotals = new Map<string, number>();
  selectedItems.forEach((item) => {
    item.stats?.affects?.forEach((affect) => {
      if (affect.type !== 'stat' || affect.value === undefined) return;
      const key = normalize(affect.stat ?? 'unknown');
      affectsTotals.set(key, (affectsTotals.get(key) ?? 0) + affect.value);
    });
  });

  const damages = selectedItems
    .map((item) => item.stats?.damage)
    .filter(Boolean)
    .map((d) => d as string);

  return { totalWeight, totalAC, affectsTotals, damages, count: selectedItems.length };
};

