import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Item, ItemAffect } from '@/types/items';
import { Suggestion } from '@/types/suggestions';

const DB_BINDING = 'ITEMS_DB';

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
  flags: string | null;
  stats: string | null;
  submittedBy: string | null;
  submittedByUserId: string | null;
  droppedBy: string | null;
  worn: string | null;
  ego: string | null;
  isArtifact: number | null;
  raw: string | null;
  flaggedForReview: number | null;
  duplicateOf: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type SubmitterRow = {
  id: string; // normalized key (lowercase)
  name: string;
  submissionCount: number;
  itemIds: string | null; // JSON array of item ids
  lastSubmittedAt: string | null;
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

let schemaReady: Promise<void> | null = null;

const ensureSchema = async (db: D1Database) => {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db
        .prepare(
          `
          CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            keywords TEXT NOT NULL,
            type TEXT NOT NULL,
            flags TEXT NOT NULL,
            stats TEXT NOT NULL,
            submittedBy TEXT,
            submittedByUserId TEXT,
            droppedBy TEXT,
            worn TEXT,
            ego TEXT,
            isArtifact INTEGER DEFAULT 0,
            raw TEXT,
            flaggedForReview INTEGER DEFAULT 0,
            duplicateOf TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );
        `,
        )
        .run();

      await db
        .prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_items_identity ON items(name, keywords, type);')
        .run();

      await db
        .prepare(
          `
          CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            itemId TEXT NOT NULL,
            identityKey TEXT NOT NULL,
            submittedBy TEXT,
            submittedByUserId TEXT,
            submittedAt TEXT NOT NULL,
            delta TEXT,
            raw TEXT,
            ipHash TEXT
          );
        `,
        )
        .run();

      await db
        .prepare(
          `
          CREATE TABLE IF NOT EXISTS submitters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            submissionCount INTEGER NOT NULL DEFAULT 0,
            itemIds TEXT,
            lastSubmittedAt TEXT
          );
        `,
        )
        .run();

      // Backfill newly added columns if the table already exists
      await db.prepare('ALTER TABLE items ADD COLUMN submittedBy TEXT;').run().catch(() => {});
      await db.prepare('ALTER TABLE items ADD COLUMN submittedByUserId TEXT;').run().catch(() => {});
      await db.prepare('ALTER TABLE items ADD COLUMN droppedBy TEXT;').run().catch(() => {});
      await db.prepare('ALTER TABLE items ADD COLUMN worn TEXT;').run().catch(() => {});
      await db.prepare('ALTER TABLE submissions ADD COLUMN submittedByUserId TEXT;').run().catch(() => {});
      await db.prepare('ALTER TABLE submissions ADD COLUMN ipHash TEXT;').run().catch(() => {});

      await db
        .prepare(
          `
          CREATE TABLE IF NOT EXISTS suggestions (
            id TEXT PRIMARY KEY,
            itemId TEXT NOT NULL,
            proposer TEXT,
            note TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            createdAt TEXT NOT NULL
          );
        `,
        )
        .run();

      await db
        .prepare('CREATE INDEX IF NOT EXISTS idx_suggestions_itemId ON suggestions(itemId);')
        .run();
    })();
  }

  return schemaReady;
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
    ego: incoming.ego ?? existing.ego,
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
  submittedBy: row.submittedBy ?? undefined,
  submittedByUserId: row.submittedByUserId ?? undefined,
  droppedBy: row.droppedBy ?? undefined,
  worn: normalizeWorn(row.worn),
  ego: row.ego ?? undefined,
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


// Decode and encode submitter rows
const decodeSubmitter = (row: SubmitterRow): { name: string; submissionCount: number; itemIds: Set<string>; lastSubmittedAt?: string } => ({
  name: row.name,
  submissionCount: row.submissionCount ?? 0,
  itemIds: new Set<string>((row.itemIds ? (JSON.parse(row.itemIds) as string[]) : []) ?? []),
  lastSubmittedAt: row.lastSubmittedAt ?? undefined,
});


// Prepare item for storage in the database
const encodeItem = (item: Item, timestamp?: string) => {
  const now = timestamp ?? new Date().toISOString();

  return {
    id: item.id,
    name: item.name,
    keywords: item.keywords,
    type: item.type,
    flags: JSON.stringify(item.flags ?? []),
    stats: JSON.stringify(item.stats ?? { affects: [], weight: 0 }),
    submittedBy: item.submittedBy ?? null,
    submittedByUserId: item.submittedByUserId ?? null,
    droppedBy: item.droppedBy ?? null,
    worn: (() => {
      const worn = normalizeWorn(item.worn);
      return worn && worn.length ? JSON.stringify(worn) : null;
    })(),
    ego: item.ego ?? null,
    isArtifact: item.isArtifact ? 1 : 0,
    raw: item.raw ? JSON.stringify(item.raw) : JSON.stringify([]),
    flaggedForReview: item.flaggedForReview ? 1 : 0,
    duplicateOf: item.duplicateOf ?? null,
    createdAt: now,
    updatedAt: now,
  };
};


const encodeSubmitter = (id: string, data: { name: string; submissionCount: number; itemIds: Set<string>; lastSubmittedAt?: string }) => ({
  id,
  name: data.name,
  submissionCount: data.submissionCount,
  itemIds: JSON.stringify(Array.from(data.itemIds)),
  lastSubmittedAt: data.lastSubmittedAt ?? null,
});


// Ensure min/max ranges are populated based on current value
const primeRanges = (item: Item): Item => ({
  ...item,
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







// Sanitize limit to be within reasonable bounds
const sanitizeLimit = (value?: number) => {
  if (!Number.isFinite(value) || value === undefined || value === null) return 100;
  return Math.min(Math.max(1, Math.floor(value)), 500);
};


// Search items with optional filters
export const searchItems = async (params: ItemSearchParams = {}): Promise<Item[]> => {
  const db = await getDatabase();
  await ensureSchema(db);

  const where: string[] = [];
  const values: unknown[] = [];

  if (params.id) {
    where.push('id = ?');
    values.push(params.id);
  }

  if (params.q) {
    const like = `%${params.q.toLowerCase()}%`;
    where.push('(LOWER(name) LIKE ? OR LOWER(keywords) LIKE ? OR LOWER(type) LIKE ? OR LOWER(flags) LIKE ?)');
    values.push(like, like, like, like);
  }

  if (params.type) {
    where.push('LOWER(type) LIKE ?');
    values.push(`%${params.type.toLowerCase()}%`);
  }

  if (params.submittedByUserId) {
    where.push('submittedByUserId = ?');
    values.push(params.submittedByUserId);
  }


  if (typeof params.flagged === 'boolean') {
    where.push('flaggedForReview = ?');
    values.push(params.flagged ? 1 : 0);
  }

  const limit = sanitizeLimit(params.limit);
  const offset = Number.isFinite(params.offset) && (params.offset ?? 0) > 0 ? Math.floor(params.offset ?? 0) : 0;

  const sql = `
    SELECT * FROM items
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY updatedAt DESC
    LIMIT ? OFFSET ?;
  `;

  const result = await db.prepare(sql).bind(...values, limit, offset).all<StoredItemRow>();
  const rows = (result.results ?? result.rows ?? []) as StoredItemRow[];

  const items = rows.map(decodeItem);

  // Attach contributors/submission counts
  if (items.length) {
    const ids = items.map((i) => i.id);
    const placeholders = ids.map(() => '?').join(', ');
    const submissionsResult = await db
      .prepare(`SELECT itemId, submittedBy FROM submissions WHERE itemId IN (${placeholders})`)
      .bind(...ids)
      .all<{ itemId: string; submittedBy: string | null }>();
    const submissions = (submissionsResult.results ?? submissionsResult.rows ?? []) as {
      itemId: string;
      submittedBy: string | null;
    }[];

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


// Fetch all items (for app initialization, caching, etc)
export const fetchItems = async (): Promise<Item[]> => searchItems();


// Insert into Items table with upsert on unique identity (name, keywords, type)
// We update all fields on conflict to ensure latest data is stored
// including flags, stats, ego, isArtifact, raw, flaggedForReview, duplicateOf, and updatedAt
export const upsertItems = async (items: Item[], context?: { submissionIpHash?: string | null }) => {
  if (!items.length) return;

  const db = await getDatabase();
  await ensureSchema(db);

  const now = new Date().toISOString();

  const submitterCache = new Map<string, { name: string; submissionCount: number; itemIds: Set<string>; lastSubmittedAt?: string }>();
  const loadSubmitter = async (name: string) => {
    const key = name.toLowerCase().trim();
    if (submitterCache.has(key)) return submitterCache.get(key)!;
    const result = await db.prepare('SELECT * FROM submitters WHERE id = ?1 LIMIT 1;').bind(key).all<SubmitterRow>();
    const row = (result.results ?? result.rows ?? [])[0] as SubmitterRow | undefined;
    const decoded = row ? decodeSubmitter(row) : { name, submissionCount: 0, itemIds: new Set<string>(), lastSubmittedAt: undefined };
    submitterCache.set(key, decoded);
    return decoded;
  };

  const fetchExistingByIdentity = async (item: Item): Promise<Item | undefined> => {
    const result = await db
      .prepare('SELECT * FROM items WHERE name = ?1 AND keywords = ?2 AND type = ?3 LIMIT 1;')
      .bind(item.name, item.keywords, item.type)
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

  const ensureId = (id?: string) => id ?? (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11));

  const statements = await Promise.all(
    items.map(async (item) => {
      const existingById = item.id ? await fetchExistingById(item.id) : undefined;
      const existingByIdentity = await fetchExistingByIdentity(item);
      const existing = existingById ?? existingByIdentity;

      const merged = existing ? mergeItems(existing, item) : primeRanges(item);
      const stableId = ensureId(existing?.id ?? item.id);
      const values = encodeItem({ ...primeRanges(merged), id: stableId }, now);

      // If we found an existing record (by id or identity), perform an update to avoid PK conflicts.
      if (existing) {
        return db
          .prepare(
            `
            UPDATE items SET
              name = ?2,
              keywords = ?3,
              type = ?4,
              flags = ?5,
              stats = ?6,
              submittedBy = ?7,
              submittedByUserId = ?8,
              droppedBy = ?9,
              worn = ?10,
              ego = ?11,
              isArtifact = ?12,
              raw = ?13,
              flaggedForReview = ?14,
              duplicateOf = ?15,
              updatedAt = ?16
            WHERE id = ?1;
          `,
          )
          .bind(
            values.id,
            values.name,
            values.keywords,
            values.type,
            values.flags,
            values.stats,
            values.submittedBy,
            values.submittedByUserId,
            values.droppedBy,
            values.worn,
            values.ego,
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
          id, name, keywords, type, flags, stats, submittedBy, submittedByUserId, droppedBy, worn, ego, isArtifact, raw,
          flaggedForReview, duplicateOf, createdAt, updatedAt
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
        ON CONFLICT(name, keywords, type) DO UPDATE SET
          name=excluded.name,
          keywords=excluded.keywords,
          type=excluded.type,
          flags=excluded.flags,
          stats=excluded.stats,
          submittedBy=excluded.submittedBy,
          submittedByUserId=excluded.submittedByUserId,
          droppedBy=excluded.droppedBy,
          worn=excluded.worn,
          ego=excluded.ego,
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
        values.flags,
        values.stats,
        values.submittedBy,
        values.submittedByUserId,
        values.droppedBy,
        values.worn,
        values.ego,
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
    items.map(async (item) => {
      const submitterName = item.submittedBy?.trim();
      const submitterId = item.submittedByUserId?.trim();
      if (!submitterName && !submitterId) return null;

      const identityKey = submissionIdentity(item);
      const submissionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);

      const existing = await fetchExistingByIdentity(item) ?? (item.id ? await fetchExistingById(item.id) : undefined);
      const mergedId = existing?.id ?? item.id;

      if (submitterName) {
        const submitter = await loadSubmitter(submitterName);
        submitter.submissionCount += 1;
        submitter.lastSubmittedAt = now;

        submitter.itemIds.add(mergedId);
      }

      return db
        .prepare(
          `
          INSERT INTO submissions (id, itemId, identityKey, submittedBy, submittedByUserId, submittedAt, delta, raw, ipHash)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);
        `,
        )
        .bind(
          submissionId,
          mergedId,
          identityKey,
          submitterName,
          submitterId ?? null,
          now,
          null,
          item.raw ? JSON.stringify(item.raw) : null,
          context?.submissionIpHash ?? null,
        );
    }),
  );

  const submitterStatements = Array.from(submitterCache.entries()).map(([id, data]) => {
    const enc = encodeSubmitter(id, data);
    return db
      .prepare(
        `
        INSERT INTO submitters (id, name, submissionCount, itemIds, lastSubmittedAt)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          submissionCount=excluded.submissionCount,
          itemIds=excluded.itemIds,
          lastSubmittedAt=excluded.lastSubmittedAt;
      `,
      )
      .bind(enc.id, enc.name, enc.submissionCount, enc.itemIds, enc.lastSubmittedAt);
  });

  const submissionPrep = submissionStatements.filter(Boolean) as D1PreparedStatement[];

  await db.batch([...statements, ...submissionPrep, ...submitterStatements]);
};


// Delete all items from the database
export const deleteAllItems = async () => {
  const db = await getDatabase();
  await ensureSchema(db);
  await db.prepare('DELETE FROM items;').run();
};

// Delete a single item by ID
export const deleteItem = async (id: string) => {
  if (!id) return;
  const db = await getDatabase();
  await ensureSchema(db);
  await db.prepare('DELETE FROM items WHERE id = ?1;').bind(id).run();
};

// Add a suggestion for an item aka, an edit proposal
export const addSuggestion = async (suggestion: Suggestion) => {
  const db = await getDatabase();
  await ensureSchema(db);

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
