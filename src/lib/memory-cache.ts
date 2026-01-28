type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

// Persist the cache across module reloads in dev by hanging it off globalThis.
// In serverless environments the cache is still best-effort and per-isolate.
const globalScope = globalThis as typeof globalThis & { __bmCache?: Map<string, CacheEntry<unknown>> };
const cache: Map<string, CacheEntry<unknown>> = globalScope.__bmCache ?? new Map();
globalScope.__bmCache = cache;
const DEFAULT_TTL_MS = 3_600_000; // 1 hour

export const getCached = <T>(key: string, ttlMs = DEFAULT_TTL_MS): T | undefined => {
  const entry = cache.get(key);
  if (!entry) return undefined;

  const isFresh = Date.now() - entry.timestamp < ttlMs;
  if (!isFresh) {
    cache.delete(key);
    return undefined;
  }

  return entry.value as T;
};

export const setCached = <T>(key: string, value: T): void => {
  cache.set(key, { value, timestamp: Date.now() });
};

export const clearCache = () => {
  cache.clear();
};
