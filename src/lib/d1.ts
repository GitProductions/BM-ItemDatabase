import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Item, ItemAffect } from '@/types/items';
import { Suggestion } from '@/types/suggestions';
import { generateShortId } from '@/lib/id';
import { mergeEgo } from '@/lib/ego';

const DB_BINDING = 'bm_itemdb';

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<unknown>;
  all: <T = unknown>() => Promise<{ results?: T[]; rows?: T[] }>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<unknown>;
};


type StoredItemRow = {
  id: string;
  name: string;
  keywords: string;
  type: string;
  identityKey: string | null;
  flags: string | null;
  stats: string | null;
  droppedBy: string | null;
  worn: string | null;
  ego: string | null;
  egoMin: string | null;
  egoMax: string | null;
  isArtifact: number | null;
  raw: string | null;
  flaggedForReview: number | null;
  duplicateOf: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type LeaderboardEntry = {
  name: string;
  submissionCount: number;
  itemCount?: number;
  lastSubmittedAt?: string;
};

export type LeaderboardData = {
  entries: LeaderboardEntry[];
  totals: {
    submissions: number;
    distinctItems: number;
  };
};

export type ItemsVersion = {
  latestUpdatedAt: string | null;
  totalAll: number;
};

export type ItemVariant = {
  submissionId: string;
  itemId: string;
  submittedAt: string;
  submittedBy?: string;
  submittedByUserId?: string;
  raw?: string[];
  parsedItem?: Item;
};

export type ItemSearchParams = {
  q?: string;
  type?: string;
  submittedBy?: string;
  submittedByUserId?: string;
  flagged?: boolean;
  id?: string;
  limit?: number;
  offset?: number;
};

const getDatabase = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as Record<string, unknown>)[DB_BINDING];

  if (!db) {
    throw new Error(`Missing D1 binding "${DB_BINDING}". Check wrangler.jsonc d1_databases.`);
  }

  return db as D1Database;
};

// NOTE: D1 stores JSON in a TEXT column; this parses legacy shapes (string, CSV string, array)
// into a normalized string[] so the rest of the app can treat worn as an array.
const normalizeWorn = (input: unknown): string[] | undefined => {
  if (input === null || input === undefined) return undefined;

  const toArray = (value: unknown) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // support comma-delimited fallback
      return value.includes(',') ? value.split(',') : [value];
    }
    return [];
  };

  try {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    const normalized = toArray(parsed)
      .map((entry) => String(entry).trim().toLowerCase())
      .filter(Boolean);
    const unique = Array.from(new Set(normalized));
    return unique.length ? unique : undefined;
  } catch {
    const normalized = toArray(input)
      .map((entry) => String(entry).trim().toLowerCase())
      .filter(Boolean);
    const unique = Array.from(new Set(normalized));
    return unique.length ? unique : undefined;
  }
};

// NOTE: Despite the name, this is effectively a parse-and-union helper to avoid dropping slots
// when upserting rows that might already contain worn data.
const mergeWorn = (existing?: string[], incoming?: string[]): string[] | undefined => {
  const current = normalizeWorn(existing) ?? [];
  const next = normalizeWorn(incoming) ?? [];
  const combined = Array.from(new Set([...current, ...next]));
  return combined.length ? combined : undefined;
};


// Merge Ranges for weight, ac, etc upon new submission
const mergeRange = (
  current: { min?: number; max?: number; value?: number },
  incoming?: number,
): { min?: number; max?: number; value?: number } => {
  if (incoming === undefined || incoming === null) return current;
  const baseMin = current.min ?? current.value ?? incoming;
  const baseMax = current.max ?? current.value ?? incoming;
  return {
    min: Math.min(baseMin, incoming),
    max: Math.max(baseMax, incoming),
    value: incoming,
  };
};

// Merge Affects upon new submission
const mergeAffects = (
  existing: Item['stats']['affects'] = [],
  incoming: Item['stats']['affects'] = [],
): ItemAffect[] => {

  const normalize = (affect: ItemAffect): ItemAffect => ({
    ...affect,
    min: affect.min ?? affect.value,
    max: affect.max ?? affect.value,
  });

  const map = new Map<string, ItemAffect>();

  existing.forEach((affect) => {
    const key = `${affect.type}:${affect.stat ?? affect.spell ?? 'unknown'}`;
    map.set(key, normalize(affect));
  });

  incoming.forEach((affect) => {
    const key = `${affect.type}:${affect.stat ?? affect.spell ?? 'unknown'}`;
    const normalized = normalize(affect);
    const current = map.get(key);
    if (!current) {
      map.set(key, normalized);
      return;
    }
    const min = Math.min(current.min ?? current.value ?? 0, normalized.min ?? normalized.value ?? 0);
    const max = Math.max(current.max ?? current.value ?? 0, normalized.max ?? normalized.value ?? 0);
    map.set(key, { ...current, ...normalized, min, max, value: normalized.value ?? current.value });
  });

  return Array.from(map.values());
};


// Merge two items together, combining ranges and affects to give users a estimated range of stats available
const mergeItems = (existing: Item, incoming: Item): Item => {
  const weightRange = mergeRange(
    { min: existing.stats.weightMin, max: existing.stats.weightMax, value: existing.stats.weight },
    incoming.stats.weight,
  );
  const acRange = mergeRange(
    { min: existing.stats.acMin, max: existing.stats.acMax, value: existing.stats.ac },
    incoming.stats.ac,
  );
  const egoRange = mergeEgo(
    { ego: existing.ego, egoMin: existing.egoMin, egoMax: existing.egoMax },
    incoming.ego,
  );

  return {
    ...existing,
    // prefer incoming identity/metadata so edits are applied
    name: incoming.name ?? existing.name,
    keywords: incoming.keywords ?? existing.keywords,
    type: incoming.type ?? existing.type,
    flags: incoming.flags !== undefined ? incoming.flags : existing.flags ?? [],
    stats: {
      ...existing.stats,
      ...incoming.stats,
      weight: weightRange.value ?? existing.stats.weight,
      weightMin: weightRange.min,
      weightMax: weightRange.max,
      ac: acRange.value ?? existing.stats.ac,
      acMin: acRange.min,
      acMax: acRange.max,
      affects: mergeAffects(existing.stats.affects, incoming.stats.affects),
    },
    ego: egoRange.ego ?? existing.ego,
    egoMin: egoRange.egoMin,
    egoMax: egoRange.egoMax,
    isArtifact: Boolean(existing.isArtifact || incoming.isArtifact),
    submittedBy: incoming.submittedBy ?? existing.submittedBy,
    submittedByUserId: incoming.submittedByUserId ?? existing.submittedByUserId,
    droppedBy: incoming.droppedBy ?? existing.droppedBy,
    worn: mergeWorn(existing.worn, incoming.worn),
    raw: incoming.raw !== undefined ? incoming.raw : existing.raw,
    flaggedForReview:
      incoming.flaggedForReview !== undefined ? incoming.flaggedForReview : existing.flaggedForReview,
    duplicateOf: incoming.duplicateOf ?? existing.duplicateOf,
  };
};


// Parse database row into Item object
const decodeItem = (row: StoredItemRow): Item => ({
  id: row.id,
  name: row.name,
  keywords: row.keywords,
  type: row.type,
  flags: row.flags ? (JSON.parse(row.flags) as string[]) : [],
  stats: row.stats ? (JSON.parse(row.stats) as Item['stats']) : { affects: [], weight: 0 },
  submittedBy: undefined,
  submittedByUserId: undefined,
  droppedBy: row.droppedBy ?? undefined,
  worn: normalizeWorn(row.worn),
  ego: row.ego ?? undefined,
  egoMin: row.egoMin ?? undefined,
  egoMax: row.egoMax ?? undefined,
  isArtifact: row.isArtifact === 1,
  raw: row.raw ? (JSON.parse(row.raw) as string[]) : undefined,
  flaggedForReview: row.flaggedForReview === 1,
  duplicateOf: row.duplicateOf ?? undefined,
  submissionCount: 0,
  contributors: [],
});


// The unique identity key for submissions to prevent duplicates
const submissionIdentity = (item: Item) =>
  `${item.name.toLowerCase().trim()}|${item.keywords.toLowerCase().trim()}|${item.type.toLowerCase().trim()}`;

const normalizeSubmitterKey = (name?: string | null) => (name ?? '').trim().toLowerCase();

const parseJson = <T>(value?: string | null): T | undefined => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

const toFtsQuery = (raw: string): string | null => {
  const tokens = raw
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9_*]/g, ''))
    .filter(Boolean)
    .slice(0, 8);

  if (!tokens.length) return null;
  return tokens.map((token) => (token.endsWith('*') ? token : `${token}*`)).join(' AND ');
};

// Normalize raw identify dumps for equality checks
const normalizeRaw = (raw?: string[]) =>
  (raw ?? [])
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

const isExactRawMatch = (a?: string[], b?: string[]) => normalizeRaw(a) !== '' && normalizeRaw(a) === normalizeRaw(b);

export type UpsertResult = { id: string; duplicate: boolean; duplicateOf?: string };


/**
 * Fetch submitter leaderboard (top contributors by submission count).
 * Fully derived from the `submissions` event log to avoid stale materialized tables.
 */
export const fetchSubmitterLeaderboard = async (limit = 20): Promise<LeaderboardData> => {
  const db = await getDatabase();

  const cappedLimit = Math.max(1, Math.min(limit, 100));

  // Aggregate directly from submissions to keep counts accurate without a materialized table
  const result = await db
    .prepare(
      `
        WITH aggregated AS (
          SELECT
            submittedByKey,
            COUNT(*) AS submissionCount,
            COUNT(DISTINCT itemId) AS itemCount,
            MAX(submittedAt) AS lastSubmittedAt
          FROM submissions
          GROUP BY submittedByKey
        ),
        latest_name AS (
          SELECT
            submittedByKey,
            COALESCE(NULLIF(TRIM(submittedBy), ''), 'Unknown') AS name,
            ROW_NUMBER() OVER (
              PARTITION BY submittedByKey
              ORDER BY submittedAt DESC, id DESC
            ) AS rn
          FROM submissions
        )
        SELECT
          COALESCE(n.name, 'Unknown') AS name,
          a.submissionCount,
          a.itemCount,
          a.lastSubmittedAt
        FROM aggregated a
        LEFT JOIN latest_name n
          ON n.submittedByKey = a.submittedByKey
         AND n.rn = 1
        ORDER BY submissionCount DESC, lastSubmittedAt DESC
        LIMIT ?1;
      `,
    )
    .bind(cappedLimit)
    .all<{ name: string; submissionCount: number; itemCount: number; lastSubmittedAt: string }>();

  const rows = (result.results ?? result.rows ?? []) as {
    name: string;
    submissionCount: number;
    itemCount: number;
    lastSubmittedAt: string;
  }[];

  const entries = rows.map((row) => ({
    name: row.name,
    submissionCount: row.submissionCount,
    itemCount: row.itemCount ?? undefined,
    lastSubmittedAt: row.lastSubmittedAt ?? undefined,
  }));

  const totalsResult = await db
    .prepare('SELECT COUNT(*) as submissions FROM submissions;')
    .all<{ submissions: number }>();
  const totalsRow = (totalsResult.results ?? totalsResult.rows ?? [])[0] as { submissions: number } | undefined;

  const itemsResult = await db.prepare('SELECT COUNT(*) as itemCount FROM items;').all<{ itemCount: number }>();
  const itemsRow = (itemsResult.results ?? itemsResult.rows ?? [])[0] as { itemCount: number } | undefined;

  return {
    entries,
    totals: {
      submissions: totalsRow?.submissions ?? 0,
      distinctItems: itemsRow?.itemCount ?? 0,
    },
  };
};


// Prepare item for storage in the database
const encodeItem = (item: Item, timestamp?: string) => {
  const now = timestamp ?? new Date().toISOString();

  return {
    id: item.id,
    name: item.name,
    keywords: item.keywords,
    type: item.type,
    identityKey: submissionIdentity(item),
    flags: JSON.stringify(item.flags ?? []),
    stats: JSON.stringify(item.stats ?? { affects: [], weight: 0 }),
    droppedBy: item.droppedBy ?? null,
    worn: (() => {
      const worn = normalizeWorn(item.worn);
      return worn && worn.length ? JSON.stringify(worn) : null;
    })(),
    ego: item.ego ?? null,
    egoMin: item.egoMin ?? null,
    egoMax: item.egoMax ?? null,
    isArtifact: item.isArtifact ? 1 : 0,
    raw: item.raw ? JSON.stringify(item.raw) : JSON.stringify([]),
    flaggedForReview: item.flaggedForReview ? 1 : 0,
    duplicateOf: item.duplicateOf ?? null,
    createdAt: now,
    updatedAt: now,
  };
};


// Ensure min/max ranges are populated based on current value
const primeRanges = (item: Item): Item => ({
  ...item,
  egoMin: item.egoMin ?? item.ego,
  egoMax: item.egoMax ?? item.ego,
  stats: {
    ...item.stats,
    weightMin: item.stats.weightMin ?? item.stats.weight,
    weightMax: item.stats.weightMax ?? item.stats.weight,
    acMin: item.stats.acMin ?? item.stats.ac,
    acMax: item.stats.acMax ?? item.stats.ac,
    affects:
      item.stats.affects?.map((affect) => ({
        ...affect,
        min: affect.min ?? affect.value,
        max: affect.max ?? affect.value,
      })) ?? [],
  },
});







// Sanitize limit to balance completeness with response time.
// Default 200 covers current dataset; hard cap 1000 to avoid slow queries.
const sanitizeLimit = (value?: number) => {
  if (!Number.isFinite(value) || value === undefined || value === null) return 500;
  return Math.min(Math.max(1, Math.floor(value)), 1000);
};

const buildItemQueryFilters = (params: ItemSearchParams) => {
  const joins: string[] = [];
  const where: string[] = [];
  const values: unknown[] = [];

  if (params.q) {
    const ftsQuery = toFtsQuery(params.q);
    if (!ftsQuery) {
      where.push('1 = 0');
    } else {
      joins.push('INNER JOIN items_fts ON items_fts.rowid = items.rowid');
      where.push('items_fts MATCH ?');
      values.push(ftsQuery);
    }
  }

  if (params.id) {
    where.push('items.id = ?');
    values.push(params.id);
  }

  if (params.type) {
    where.push('LOWER(items.type) LIKE ?');
    values.push(`%${params.type.toLowerCase()}%`);
  }

  if (params.submittedByUserId) {
    where.push('EXISTS (SELECT 1 FROM submissions s WHERE s.itemId = items.id AND s.submittedByUserId = ?)');
    values.push(params.submittedByUserId);
  }

  if (params.submittedBy) {
    where.push('EXISTS (SELECT 1 FROM submissions s WHERE s.itemId = items.id AND s.submittedByKey = ?)');
    values.push(normalizeSubmitterKey(params.submittedBy));
  }

  if (typeof params.flagged === 'boolean') {
    where.push('items.flaggedForReview = ?');
    values.push(params.flagged ? 1 : 0);
  }

  return { joins, where, values };
};


// Search items with optional filters
export const searchItems = async (params: ItemSearchParams = {}): Promise<Item[]> => {
  const db = await getDatabase();
  const { joins, where, values } = buildItemQueryFilters(params);

  const limit = sanitizeLimit(params.limit);
  const offset = Number.isFinite(params.offset) && (params.offset ?? 0) > 0 ? Math.floor(params.offset ?? 0) : 0;

  const sql = `
    SELECT items.* FROM items
    ${joins.length ? joins.join('\n') : ''}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY items.updatedAt DESC
    LIMIT ? OFFSET ?;
  `;

  const result = await db.prepare(sql).bind(...values, limit, offset).all<StoredItemRow>();
  const rows = (result.results ?? result.rows ?? []) as StoredItemRow[];

  const items = rows.map(decodeItem);

  // Attach contributors/submission counts
  if (items.length) {
    const ids = items.map((i) => i.id);


    const chunkSize = 75;
    const submissions: { itemId: string; submittedBy: string | null }[] = [];
    for (let start = 0; start < ids.length; start += chunkSize) {
      const chunk = ids.slice(start, start + chunkSize);
      if (!chunk.length) continue;
      const placeholders = chunk.map(() => '?').join(', ');
      const res = await db
        .prepare(`SELECT itemId, submittedBy FROM submissions WHERE itemId IN (${placeholders})`)
        .bind(...chunk)
        .all<{ itemId: string; submittedBy: string | null }>();
      submissions.push(...((res.results ?? res.rows ?? []) as { itemId: string; submittedBy: string | null }[]));
    }

    const grouped = new Map<string, { names: Set<string>; count: number }>();
    submissions.forEach((row) => {
      const entry = grouped.get(row.itemId) ?? { names: new Set<string>(), count: 0 };
      if (row.submittedBy) entry.names.add(row.submittedBy);
      entry.count += 1;
      grouped.set(row.itemId, entry);
    });

    items.forEach((item) => {
      const group = grouped.get(item.id);
      if (group) {
        item.submissionCount = group.count;
        item.contributors = Array.from(group.names);
        if (!item.submittedBy && group.names.size > 0) {
          item.submittedBy = Array.from(group.names)[0];
        }
      }
    });
  }

  return items;
};

export const fetchItemVariants = async (itemId: string, limit = 200): Promise<ItemVariant[]> => {
  if (!itemId) return [];
  const db = await getDatabase();
  const cappedLimit = Math.max(1, Math.min(limit, 500));

  const result = await db
    .prepare(
      `
        SELECT id, itemId, submittedBy, submittedByUserId, submittedAt, raw, parsedItem
        FROM submissions
        WHERE itemId = ?1
        ORDER BY submittedAt DESC, id DESC
        LIMIT ?2;
      `,
    )
    .bind(itemId, cappedLimit)
    .all<{
      id: string;
      itemId: string;
      submittedBy: string | null;
      submittedByUserId: string | null;
      submittedAt: string;
      raw: string | null;
      parsedItem: string | null;
    }>();

  const rows = (result.results ?? result.rows ?? []) as {
    id: string;
    itemId: string;
    submittedBy: string | null;
    submittedByUserId: string | null;
    submittedAt: string;
    raw: string | null;
    parsedItem: string | null;
  }[];

  return rows.map((row) => {
    const parsedItem = parseJson<Item>(row.parsedItem);
    if (parsedItem) {
      parsedItem.flags = parsedItem.flags ?? [];
      parsedItem.stats = parsedItem.stats ?? { affects: [], weight: 0 };
    }

    return {
      submissionId: row.id,
      itemId: row.itemId,
      submittedAt: row.submittedAt,
      submittedBy: row.submittedBy ?? undefined,
      submittedByUserId: row.submittedByUserId ?? undefined,
      raw: parseJson<string[]>(row.raw),
      parsedItem: parsedItem ?? undefined,
    };
  });
};

export const fetchItemVariant = async (itemId: string, submissionId: string): Promise<ItemVariant | null> => {
  if (!itemId || !submissionId) return null;
  const db = await getDatabase();

  const result = await db
    .prepare(
      `
        SELECT id, itemId, submittedBy, submittedByUserId, submittedAt, raw, parsedItem
        FROM submissions
        WHERE itemId = ?1 AND id = ?2
        LIMIT 1;
      `,
    )
    .bind(itemId, submissionId)
    .all<{
      id: string;
      itemId: string;
      submittedBy: string | null;
      submittedByUserId: string | null;
      submittedAt: string;
      raw: string | null;
      parsedItem: string | null;
    }>();

  const row = (result.results ?? result.rows ?? [])[0] as
    | {
        id: string;
        itemId: string;
        submittedBy: string | null;
        submittedByUserId: string | null;
        submittedAt: string;
        raw: string | null;
        parsedItem: string | null;
      }
    | undefined;

  if (!row) return null;

  const parsedItem = parseJson<Item>(row.parsedItem);
  if (parsedItem) {
    parsedItem.flags = parsedItem.flags ?? [];
    parsedItem.stats = parsedItem.stats ?? { affects: [], weight: 0 };
  }

  return {
    submissionId: row.id,
    itemId: row.itemId,
    submittedAt: row.submittedAt,
    submittedBy: row.submittedBy ?? undefined,
    submittedByUserId: row.submittedByUserId ?? undefined,
    raw: parseJson<string[]>(row.raw),
    parsedItem: parsedItem ?? undefined,
  };
};

export const countItemsFiltered = async (params: ItemSearchParams = {}): Promise<number> => {
  const db = await getDatabase();
  const { joins, where, values } = buildItemQueryFilters(params);

  const sql = `
    SELECT COUNT(*) AS count
    FROM items
    ${joins.length ? joins.join('\n') : ''}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''};
  `;

  const result = await db.prepare(sql).bind(...values).all<{ count: number }>();
  const row = (result.results ?? result.rows ?? [])[0] as { count: number } | undefined;
  return row?.count ?? 0;
};


export const countItems = async (): Promise<number> => {
  const db = await getDatabase();

  // wrangler d1 execute <DATABASE_NAME> --command="SELECT COUNT(*) FROM <TABLE_NAME>;" --remote


  const result = await db.prepare('SELECT COUNT(*) AS count FROM items;').all<{ count: number }>();
  const row = (result.results ?? result.rows ?? [])[0] as { count: number } | undefined;
  return row?.count ?? 0;

};

export const fetchItemsVersion = async (): Promise<ItemsVersion> => {
  // Lightweight freshness query used by API responses to coordinate client-side race protection.
  // This is intentionally cheaper than fetching item rows.
  const db = await getDatabase();
  const result = await db
    .prepare('SELECT MAX(updatedAt) AS latestUpdatedAt, COUNT(*) AS totalAll FROM items;')
    .all<{ latestUpdatedAt: string | null; totalAll: number }>();
  const row = (result.results ?? result.rows ?? [])[0] as
    | { latestUpdatedAt: string | null; totalAll: number }
    | undefined;

  const latestUpdatedAt = row?.latestUpdatedAt ?? null;
  const totalAll = row?.totalAll ?? 0;
  return { latestUpdatedAt, totalAll };
};
// Insert into items with upsert on normalized identityKey.
// We update all mutable fields on conflict to ensure latest data is stored.
// Returns the stable item IDs (existing or newly created) in the same order as the input.
export const upsertItems = async (
  items: Item[],
  context?: { submissionIpHash?: string | null; preserveIdOnIdentityChange?: boolean },
): Promise<UpsertResult[]> => {
  if (!items.length) return [];

  const db = await getDatabase();

  const now = new Date().toISOString();
  const keywordCache = new Map<string, Item[]>();

  const loadByKeyword = async (keyword: string): Promise<Item[]> => {
    const key = keyword.trim().toLowerCase();
    if (!key) return [];
    if (keywordCache.has(key)) return keywordCache.get(key)!;
    const result = await db
      .prepare('SELECT * FROM items WHERE LOWER(keywords) = ?1')
      .bind(key)
      .all<StoredItemRow>();
    const rows = (result.results ?? result.rows ?? []) as StoredItemRow[];
    const decoded = rows.map(decodeItem);
    keywordCache.set(key, decoded);
    return decoded;
  };

  const fetchExistingByIdentity = async (item: Item): Promise<Item | undefined> => {
    const result = await db
      .prepare('SELECT * FROM items WHERE identityKey = ?1 LIMIT 1;')
      .bind(submissionIdentity(item))
      .all<StoredItemRow>();
    const row = (result.results ?? result.rows ?? [])[0] as StoredItemRow | undefined;
    return row ? decodeItem(row) : undefined;
  };

  // Fetch by primary id; used when an explicit id is sent with the payload.
  const fetchExistingById = async (id?: string): Promise<Item | undefined> => {
    if (!id) return undefined;
    const result = await db.prepare('SELECT * FROM items WHERE id = ?1 LIMIT 1;').bind(id).all<StoredItemRow>();
    const row = (result.results ?? result.rows ?? [])[0] as StoredItemRow | undefined;
    return row ? decodeItem(row) : undefined;
  };

  const ensureId = async (id?: string): Promise<string> => {
    if (id) return id;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateShortId(6);
      const existing = await fetchExistingById(candidate);
      if (!existing) return candidate;
    }

    // Fallback: slightly longer id to avoid repeated collisions
    return generateShortId(8);
  };

  const persisted: UpsertResult[] = [];

  const statements = await Promise.all(
    items.map(async (item, idx) => {
      // Detect duplicates before persisting submissions
      const candidates = await loadByKeyword(item.keywords);
      const duplicateMatch = candidates.find(
        (candidate) => candidate.id !== item.id && isExactRawMatch(candidate.raw, item.raw),
      );

      const existingById = item.id ? await fetchExistingById(item.id) : undefined;
      const existingByIdentity = await fetchExistingByIdentity(item);

      const idCollisionWithDifferentIdentity =
        existingById && submissionIdentity(existingById) !== submissionIdentity(item);
      const treatAsIdCollision =
        idCollisionWithDifferentIdentity && !context?.preserveIdOnIdentityChange;

      const resolvedExisting = treatAsIdCollision ? existingByIdentity : existingById ?? existingByIdentity;

      const merged = resolvedExisting ? mergeItems(resolvedExisting, item) : primeRanges(item);

      const stableId = treatAsIdCollision
        ? await ensureId(undefined)
        : await ensureId(resolvedExisting?.id ?? item.id);

      persisted[idx] = {
        id: stableId,
        duplicate: Boolean(duplicateMatch),
        duplicateOf: duplicateMatch?.id,
      };

      const values = encodeItem(
        { ...primeRanges(merged), id: stableId, duplicateOf: duplicateMatch?.id ?? merged.duplicateOf },
        now,
      );

      // If we found an existing record (by id or identity), perform an update to avoid PK conflicts.
      if (resolvedExisting) {
        return db
          .prepare(
            `
            UPDATE items SET
              name = ?2,
              keywords = ?3,
              type = ?4,
              identityKey = ?5,
              flags = ?6,
              stats = ?7,
              droppedBy = ?8,
              worn = ?9,
              ego = ?10,
              egoMin = ?11,
              egoMax = ?12,
              isArtifact = ?13,
              raw = ?14,
              flaggedForReview = ?15,
              duplicateOf = ?16,
              updatedAt = ?17
            WHERE id = ?1;
          `,
          )
          .bind(
            values.id,
            values.name,
            values.keywords,
            values.type,
            values.identityKey,
            values.flags,
            values.stats,
            values.droppedBy,
            values.worn,
            values.ego,
            values.egoMin,
            values.egoMax,
            values.isArtifact,
            values.raw,
            values.flaggedForReview,
            values.duplicateOf,
            values.updatedAt,
          );
      }

      return db
        .prepare(
          `
        INSERT INTO items (
          id, name, keywords, type, identityKey, flags, stats, droppedBy, worn, ego, egoMin, egoMax, isArtifact,
          raw, flaggedForReview, duplicateOf, createdAt, updatedAt
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
        ON CONFLICT(identityKey) DO UPDATE SET
          name=excluded.name,
          keywords=excluded.keywords,
          type=excluded.type,
          identityKey=excluded.identityKey,
          flags=excluded.flags,
          stats=excluded.stats,
          droppedBy=excluded.droppedBy,
          worn=excluded.worn,
          ego=excluded.ego,
          egoMin=excluded.egoMin,
          egoMax=excluded.egoMax,
          isArtifact=excluded.isArtifact,
          raw=excluded.raw,
          flaggedForReview=excluded.flaggedForReview,
          duplicateOf=excluded.duplicateOf,
          updatedAt=excluded.updatedAt;
      `,
      )
      .bind(
        values.id,
        values.name,
        values.keywords,
        values.type,
        values.identityKey,
        values.flags,
        values.stats,
        values.droppedBy,
        values.worn,
        values.ego,
        values.egoMin,
        values.egoMax,
        values.isArtifact,
        values.raw,
        values.flaggedForReview,
        values.duplicateOf,
        values.createdAt,
        values.updatedAt,
      );
    }),
  );

  const submissionStatements = await Promise.all(
    items.map(async (item, idx) => {
      // Skip logging submissions for exact duplicates to avoid inflating counts.
      if (persisted[idx]?.duplicate) return null;

      const submitterName = item.submittedBy?.trim();
      const submitterId = item.submittedByUserId?.trim();
      if (!submitterName && !submitterId) return null;

      const identityKey = submissionIdentity(item);
      const submissionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
      const mergedId = persisted[idx]?.id ?? item.id ?? (await ensureId(undefined));

      return db
        .prepare(
          `
          INSERT INTO submissions (
            id, itemId, identityKey, submittedBy, submittedByKey, submittedByUserId, submittedAt, raw, parsedItem, ipHash
          )
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10);
        `,
        )
        .bind(
          submissionId,
          mergedId,
          identityKey,
          submitterName,
          normalizeSubmitterKey(submitterName),
          submitterId ?? null,
          now,
          item.raw ? JSON.stringify(item.raw) : null,
          JSON.stringify(item),
          context?.submissionIpHash ?? null,
        );
    }),
  );

  const submissionPrep = submissionStatements.filter(Boolean) as D1PreparedStatement[];

  await db.batch([...statements, ...submissionPrep]);

  return persisted;
};


// Delete all items from the database
export const deleteAllItems = async () => {
  const db = await getDatabase();
  await db.prepare('DELETE FROM items;').run();
};

// Delete a single item by ID
export const deleteItem = async (id: string) => {
  if (!id) return;
  const db = await getDatabase();
  await db.prepare('DELETE FROM items WHERE id = ?1;').bind(id).run();
};

// Add a suggestion for an item aka, an edit proposal
export const addSuggestion = async (suggestion: Suggestion) => {
  const db = await getDatabase();

  const combinedNote = suggestion.reason
    ? `${suggestion.note}\n\nReason: ${suggestion.reason}`
    : suggestion.note;

  await db
    .prepare(
      `
      INSERT INTO suggestions (id, itemId, proposer, note, status, createdAt)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6);
    `,
    )
    .bind(
      suggestion.id,
      suggestion.itemId,
      suggestion.proposer ?? null,
      combinedNote,
      suggestion.status ?? 'pending',
      suggestion.createdAt ?? new Date().toISOString(),
    )
    .run();
};
