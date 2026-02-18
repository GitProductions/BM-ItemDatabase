import { getCloudflareContext } from '@opennextjs/cloudflare';

const DB_BINDING = 'bm_itemdb';

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<unknown>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch?: (statements: D1PreparedStatement[]) => Promise<unknown>;
};

export const ensureSchema = async (db: D1Database) => {
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
        droppedBy TEXT,
        worn TEXT,
        ego TEXT,
        egoMin TEXT,
        egoMax TEXT,
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
        raw TEXT,
        ipHash TEXT
      );
    `,
    )
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
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isAdmin INTEGER NOT NULL DEFAULT 0,
        lastIpHash TEXT,
        lastIpAt TEXT
      );
    `,
    )
    .run();

  await db
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS api_tokens (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        label TEXT,
        tokenHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        lastUsedAt TEXT,
        revokedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      );
    `,
    )
    .run();

  // Backfill newly added columns if the table already exists
  await db.prepare('ALTER TABLE items ADD COLUMN droppedBy TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE items ADD COLUMN worn TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE items ADD COLUMN egoMin TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE items ADD COLUMN egoMax TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE submissions ADD COLUMN submittedByUserId TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE submissions ADD COLUMN ipHash TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE users ADD COLUMN lastIpHash TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE users ADD COLUMN lastIpAt TEXT;').run().catch(() => {});
  await db.prepare('ALTER TABLE users ADD COLUMN isAdmin INTEGER NOT NULL DEFAULT 0;').run().catch(() => {});

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_item_user ON submissions(itemId, submittedByUserId);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_suggestions_itemId ON suggestions(itemId);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_api_tokens_userId ON api_tokens(userId);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);').run();
};

export const runEnsureSchema = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as Record<string, unknown>)[DB_BINDING];
  if (!db) throw new Error(`Missing D1 binding "${DB_BINDING}". Check wrangler.jsonc d1_databases.`);
  await ensureSchema(db as D1Database);
};
