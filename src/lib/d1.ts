import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Item } from '@/types/items';
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
  owner: string | null;
  ego: string | null;
  isArtifact: number | null;
  raw: string | null;
  flaggedForReview: number | null;
  duplicateOf: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type StoredSuggestionRow = {
  id: string;
  itemId: string;
  proposer: string | null;
  note: string;
  status: string;
  createdAt: string;
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
            owner TEXT,
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

const decodeItem = (row: StoredItemRow): Item => ({
  id: row.id,
  name: row.name,
  keywords: row.keywords,
  type: row.type,
  flags: row.flags ? (JSON.parse(row.flags) as string[]) : [],
  stats: row.stats ? (JSON.parse(row.stats) as Item['stats']) : { affects: [], weight: 0 },
  owner: row.owner ?? undefined,
  ego: row.ego ?? undefined,
  isArtifact: row.isArtifact === 1,
  raw: row.raw ? (JSON.parse(row.raw) as string[]) : undefined,
  flaggedForReview: row.flaggedForReview === 1,
  duplicateOf: row.duplicateOf ?? undefined,
});

const encodeItem = (item: Item, ownerOverride?: string, timestamp?: string) => {
  const now = timestamp ?? new Date().toISOString();

  return {
    id: item.id,
    name: item.name,
    keywords: item.keywords,
    type: item.type,
    flags: JSON.stringify(item.flags ?? []),
    stats: JSON.stringify(item.stats ?? { affects: [], weight: 0 }),
    owner: ownerOverride ?? item.owner ?? null,
    ego: item.ego ?? null,
    isArtifact: item.isArtifact ? 1 : 0,
    raw: item.raw ? JSON.stringify(item.raw) : JSON.stringify([]),
    flaggedForReview: item.flaggedForReview ? 1 : 0,
    duplicateOf: item.duplicateOf ?? null,
    createdAt: now,
    updatedAt: now,
  };
};

export const fetchItems = async (): Promise<Item[]> => {
  const db = await getDatabase();
  await ensureSchema(db);

  const result = await db.prepare('SELECT * FROM items ORDER BY name COLLATE NOCASE;').all<StoredItemRow>();
  const rows = (result.results ?? result.rows ?? []) as StoredItemRow[];

  return rows.map(decodeItem);
};


// Insert into Items table with upsert on unique identity (name, keywords, type)
// We update all fields on conflict to ensure latest data is stored
// including flags, stats, owner, ego, isArtifact, raw, flaggedForReview, duplicateOf, and updatedAt
export const upsertItems = async (items: Item[], ownerName?: string) => {
  if (!items.length) return;

  const db = await getDatabase();
  await ensureSchema(db);

  const now = new Date().toISOString();

  const statements = items.map((item) => {
    const values = encodeItem(item, ownerName, now);

    return db
      .prepare(
        `
        INSERT INTO items (
          id, name, keywords, type, flags, stats, owner, ego, isArtifact, raw,
          flaggedForReview, duplicateOf, createdAt, updatedAt
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
        ON CONFLICT(name, keywords, type) DO UPDATE SET
          flags=excluded.flags,
          stats=excluded.stats,
          owner=excluded.owner,
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
        values.owner,
        values.ego,
        values.isArtifact,
        values.raw,
        values.flaggedForReview,
        values.duplicateOf,
        values.createdAt,
        values.updatedAt,
      );
  });

  await db.batch(statements);
};

export const deleteAllItems = async () => {
  const db = await getDatabase();
  await ensureSchema(db);
  await db.prepare('DELETE FROM items;').run();
};

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
