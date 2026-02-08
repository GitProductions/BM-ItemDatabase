// Not currently utilized ...

// This is the EGO tier List for Blackmud Players based on their level.
// a level 1 player has 'Itty Bitty' ego, where as a level 50 player has 'Egomaniac' ego. (anything above 50 is admin)
export const EGO_TIERS: { min: number; max: number; label: string }[] = [
    { min: 0, max: 1, label: 'Itty Bitty' },
    { min: 2, max: 2, label: 'Teenie Weenie' },
    { min: 3, max: 4, label: 'Miniscule' },
    { min: 5, max: 7, label: 'Trifling' },
    { min: 8, max: 9, label: 'Wimpy' },
    { min: 10, max: 11, label: 'Humble' },
    { min: 12, max: 14, label: 'Small' },
    { min: 15, max: 17, label: 'Mediocre' },
    { min: 18, max: 19, label: 'Unimpressive' },
    { min: 20, max: 20, label: 'Boring' },
    { min: 21, max: 22, label: 'Normal' },
    { min: 23, max: 23, label: 'Moderate' },
    { min: 24, max: 28, label: 'Fair' },
    { min: 29, max: 31, label: 'Snotty' },
    { min: 32, max: 32, label: 'Wussy' },
    { min: 33, max: 33, label: 'Average' },
    { min: 34, max: 34, label: 'Notable' },
    { min: 35, max: 35, label: 'Strong' },
    { min: 36, max: 36, label: 'Colossal' },
    { min: 37, max: 38, label: 'Gigantic' },
    { min: 39, max: 39, label: 'Humongous' },
    { min: 40, max: 42, label: 'Mammoth' },
    { min: 43, max: 43, label: 'Gargantuan' },
    { min: 44, max: 45, label: 'Herculean' },
    { min: 46, max: 50, label: 'Egomaniac' },
    { min: 51, max: 100, label: 'Creator' },
];

// Get the index of a tier label in EGO_TIERS (lower index = lower ego).
// Returns -1 for unknown labels so they sort below everything.
export const egoTierIndex = (label?: string): number => {
  if (!label) return -1;
  const normalized = label.trim().toLowerCase();
  return EGO_TIERS.findIndex((tier) => tier.label.toLowerCase() === normalized);
};

// Merge two ego tier labels, keeping track of the lowest and highest seen.
// Works like mergeRange but for ordinal tier labels instead of numbers.
export const mergeEgo = (
  current: { ego?: string; egoMin?: string; egoMax?: string },
  incoming?: string,
): { ego?: string; egoMin?: string; egoMax?: string } => {
  if (!incoming) return current;

  const baseEgo = current.ego ?? incoming;
  const baseMin = current.egoMin ?? baseEgo;
  const baseMax = current.egoMax ?? baseEgo;

  const incomingIdx = egoTierIndex(incoming);
  const minIdx = egoTierIndex(baseMin);
  const maxIdx = egoTierIndex(baseMax);

  // If any label is unknown (-1) keep the known one; if both unknown keep incoming
  const newMin =
    incomingIdx === -1 ? baseMin :
    minIdx === -1 ? incoming :
    incomingIdx < minIdx ? incoming : baseMin;

  const newMax =
    incomingIdx === -1 ? baseMax :
    maxIdx === -1 ? incoming :
    incomingIdx > maxIdx ? incoming : baseMax;

  return { ego: incoming, egoMin: newMin, egoMax: newMax };
};



