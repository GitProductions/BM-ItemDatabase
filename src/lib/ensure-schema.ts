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
  // Canonical schema is managed by migrations in /migrations.
  // This bootstrap only supports fresh database initialization.
  await db
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        keywords TEXT NOT NULL,
        type TEXT NOT NULL,
        identityKey TEXT NOT NULL UNIQUE,
        flags TEXT NOT NULL,
        stats TEXT NOT NULL,
        droppedBy TEXT,
        worn TEXT,
        ego TEXT,
        egoMin TEXT,
        egoMax TEXT,
        isArtifact INTEGER NOT NULL DEFAULT 0 CHECK(isArtifact IN (0, 1)),
        raw TEXT,
        flaggedForReview INTEGER NOT NULL DEFAULT 0 CHECK(flaggedForReview IN (0, 1)),
        duplicateOf TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        CHECK(json_valid(flags)),
        CHECK(json_valid(stats)),
        CHECK(raw IS NULL OR json_valid(raw)),
        CHECK(worn IS NULL OR json_valid(worn)),
        FOREIGN KEY(duplicateOf) REFERENCES items(id) ON DELETE SET NULL
      );
    `,
    )
    .run();

  await db
    .prepare(
      `
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        identityKey TEXT NOT NULL,
        submittedBy TEXT,
        submittedByKey TEXT NOT NULL,
        submittedByUserId TEXT,
        submittedAt TEXT NOT NULL,
        raw TEXT,
        parsedItem TEXT,
        ipHash TEXT,
        FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE CASCADE
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
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        createdAt TEXT NOT NULL,
        FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE CASCADE
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
        tokenEnc TEXT,
        createdAt TEXT NOT NULL,
        lastUsedAt TEXT,
        revokedAt TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
      );
    `,
    )
    .run();

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_items_updated ON items(updatedAt DESC);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_items_flagged_updated ON items(flaggedForReview, updatedAt DESC);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_items_type_flagged ON items(type, flaggedForReview);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_item ON submissions(itemId);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_item_user ON submissions(itemId, submittedByUserId);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_submitter_key ON submissions(submittedByKey);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submittedAt DESC);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_suggestions_item ON suggestions(itemId);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_suggestions_status_created ON suggestions(status, createdAt DESC);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_api_tokens_userId ON api_tokens(userId);').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);').run();

  await db
    .prepare(
      `
      CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
        name,
        keywords,
        type,
        flags,
        content='items',
        content_rowid='rowid'
      );
    `,
    )
    .run();

  await db
    .prepare(
      `
      CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
        INSERT INTO items_fts(rowid, name, keywords, type, flags)
        VALUES (new.rowid, new.name, new.keywords, new.type, COALESCE(new.flags, ''));
      END;
    `,
    )
    .run();

  await db
    .prepare(
      `
      CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, name, keywords, type, flags)
        VALUES('delete', old.rowid, old.name, old.keywords, old.type, COALESCE(old.flags, ''));
      END;
    `,
    )
    .run();

  await db
    .prepare(
      `
      CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
        INSERT INTO items_fts(items_fts, rowid, name, keywords, type, flags)
        VALUES('delete', old.rowid, old.name, old.keywords, old.type, COALESCE(old.flags, ''));
        INSERT INTO items_fts(rowid, name, keywords, type, flags)
        VALUES (new.rowid, new.name, new.keywords, new.type, COALESCE(new.flags, ''));
      END;
    `,
    )
    .run();

  await db.prepare("INSERT INTO items_fts(items_fts) VALUES('rebuild');").run();
};

export const runEnsureSchema = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as Record<string, unknown>)[DB_BINDING];
  if (!db) throw new Error(`Missing D1 binding "${DB_BINDING}". Check wrangler.jsonc d1_databases.`);
  await ensureSchema(db as D1Database);
};
