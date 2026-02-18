-- D1 schema bootstrap (canonical for fresh databases)
-- For existing databases, apply migrations under /migrations.

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

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  proposer TEXT,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  createdAt TEXT NOT NULL,
  FOREIGN KEY(itemId) REFERENCES items(id) ON DELETE CASCADE
);

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

CREATE INDEX IF NOT EXISTS idx_items_updated ON items(updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_items_flagged_updated ON items(flaggedForReview, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_items_type_flagged ON items(type, flaggedForReview);

CREATE INDEX IF NOT EXISTS idx_submissions_item ON submissions(itemId);
CREATE INDEX IF NOT EXISTS idx_submissions_item_user ON submissions(itemId, submittedByUserId);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter_key ON submissions(submittedByKey);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submittedAt DESC);

CREATE INDEX IF NOT EXISTS idx_suggestions_item ON suggestions(itemId);
CREATE INDEX IF NOT EXISTS idx_suggestions_status_created ON suggestions(status, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_api_tokens_userId ON api_tokens(userId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_tokens_hash_active ON api_tokens(tokenHash) WHERE revokedAt IS NULL;

CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  name,
  keywords,
  type,
  flags,
  content='items',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(rowid, name, keywords, type, flags)
  VALUES (new.rowid, new.name, new.keywords, new.type, COALESCE(new.flags, ''));
END;

CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, name, keywords, type, flags)
  VALUES('delete', old.rowid, old.name, old.keywords, old.type, COALESCE(old.flags, ''));
END;

CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, name, keywords, type, flags)
  VALUES('delete', old.rowid, old.name, old.keywords, old.type, COALESCE(old.flags, ''));
  INSERT INTO items_fts(rowid, name, keywords, type, flags)
  VALUES (new.rowid, new.name, new.keywords, new.type, COALESCE(new.flags, ''));
END;
