export const generateShortId = (length = 6): string => {
  const size = Math.max(4, length); // avoid ultra-short IDs

  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    const uuid = (crypto.randomUUID as () => string)().replace(/-/g, '');
    // Pick a random start within the uuid string so concurrent calls aren’t aligned
    const start = Math.floor(Math.random() * Math.max(1, uuid.length - size));
    return uuid.slice(start, start + length).toLowerCase();
  }

  // Fallback: base36 slice of Math.random()
  return Math.random().toString(36).slice(2, 2 + size).padEnd(size, '0').slice(0, length);
};
