-- D1 Schema Migration: hardening + normalized identity + FTS5
-- Run with:
--   wrangler d1 execute bm_itemdb --file=./migrations/2026-02-17-add-Major-Changes.sql --remote

-- 1) Rebuild core tables with strict constraints
CREATE TABLE items_v2 (
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
  FOREIGN KEY(duplicateOf) REFERENCES items_v2(id) ON DELETE SET NULL
);

CREATE TABLE submissions_v2 (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  identityKey TEXT NOT NULL,
  submittedBy TEXT,
  submittedByKey TEXT NOT NULL,
  submittedByUserId TEXT,
  submittedAt TEXT NOT NULL,
  raw TEXT,
  ipHash TEXT,
  FOREIGN KEY(itemId) REFERENCES items_v2(id) ON DELETE CASCADE
);

CREATE TABLE suggestions_v2 (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  proposer TEXT,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  createdAt TEXT NOT NULL,
  FOREIGN KEY(itemId) REFERENCES items_v2(id) ON DELETE CASCADE
);

-- 2) Copy items with identity normalization and collision resolution
WITH ranked AS (
  SELECT
    id,
    name,
    keywords,
    type,
    LOWER(TRIM(name)) || '|' || LOWER(TRIM(keywords)) || '|' || LOWER(TRIM(type)) AS normalizedIdentityKey,
    flags,
    stats,
    droppedBy,
    worn,
    ego,
    egoMin,
    egoMax,
    CASE WHEN isArtifact = 1 THEN 1 ELSE 0 END AS isArtifact,
    raw,
    CASE WHEN flaggedForReview = 1 THEN 1 ELSE 0 END AS flaggedForReview,
    duplicateOf,
    createdAt,
    updatedAt,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name)) || '|' || LOWER(TRIM(keywords)) || '|' || LOWER(TRIM(type))
      ORDER BY updatedAt DESC, createdAt DESC, id DESC
    ) AS rn
  FROM items
)
INSERT INTO items_v2 (
  id,
  name,
  keywords,
  type,
  identityKey,
  flags,
  stats,
  droppedBy,
  worn,
  ego,
  egoMin,
  egoMax,
  isArtifact,
  raw,
  flaggedForReview,
  duplicateOf,
  createdAt,
  updatedAt
)
SELECT
  id,
  name,
  keywords,
  type,
  normalizedIdentityKey,
  CASE WHEN flags IS NULL OR flags = '' OR json_valid(flags) = 0 THEN '[]' ELSE flags END,
  CASE WHEN stats IS NULL OR stats = '' OR json_valid(stats) = 0 THEN '{"affects":[],"weight":0}' ELSE stats END,
  droppedBy,
  CASE WHEN worn IS NULL OR worn = '' OR json_valid(worn) = 1 THEN worn ELSE NULL END,
  ego,
  egoMin,
  egoMax,
  isArtifact,
  CASE WHEN raw IS NULL OR raw = '' OR json_valid(raw) = 0 THEN '[]' ELSE raw END,
  flaggedForReview,
  NULL,
  COALESCE(createdAt, updatedAt, datetime('now')),
  COALESCE(updatedAt, createdAt, datetime('now'))
FROM ranked
WHERE rn = 1;

-- 3) Copy submissions and suggestions through identity-mapped item IDs
INSERT INTO submissions_v2 (
  id,
  itemId,
  identityKey,
  submittedBy,
  submittedByKey,
  submittedByUserId,
  submittedAt,
  raw,
  ipHash
)
SELECT
  s.id,
  kept.id,
  s.identityKey,
  s.submittedBy,
  LOWER(TRIM(COALESCE(s.submittedBy, ''))),
  s.submittedByUserId,
  s.submittedAt,
  s.raw,
  s.ipHash
FROM submissions s
JOIN items old_item ON old_item.id = s.itemId
JOIN items_v2 kept
  ON kept.identityKey =
    LOWER(TRIM(old_item.name)) || '|' || LOWER(TRIM(old_item.keywords)) || '|' || LOWER(TRIM(old_item.type));

INSERT INTO suggestions_v2 (id, itemId, proposer, note, status, createdAt)
SELECT
  g.id,
  kept.id,
  g.proposer,
  g.note,
  CASE
    WHEN g.status IN ('pending', 'approved', 'rejected') THEN g.status
    ELSE 'pending'
  END,
  g.createdAt
FROM suggestions g
JOIN items old_item ON old_item.id = g.itemId
JOIN items_v2 kept
  ON kept.identityKey =
    LOWER(TRIM(old_item.name)) || '|' || LOWER(TRIM(old_item.keywords)) || '|' || LOWER(TRIM(old_item.type));

-- 4) Fix duplicateOf references after dedupe
WITH ranked_old AS (
  SELECT
    id,
    duplicateOf,
    LOWER(TRIM(name)) || '|' || LOWER(TRIM(keywords)) || '|' || LOWER(TRIM(type)) AS identityKey,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(name)) || '|' || LOWER(TRIM(keywords)) || '|' || LOWER(TRIM(type))
      ORDER BY updatedAt DESC, createdAt DESC, id DESC
    ) AS rn
  FROM items
)
UPDATE items_v2
SET duplicateOf = (
  SELECT kept_dup.id
  FROM ranked_old ro
  JOIN items old_dup ON old_dup.id = ro.duplicateOf
  JOIN items_v2 kept_dup
    ON kept_dup.identityKey =
      LOWER(TRIM(old_dup.name)) || '|' || LOWER(TRIM(old_dup.keywords)) || '|' || LOWER(TRIM(old_dup.type))
  WHERE ro.rn = 1
    AND ro.identityKey = items_v2.identityKey
    AND ro.duplicateOf IS NOT NULL
  LIMIT 1
)
WHERE identityKey IN (
  SELECT identityKey
  FROM ranked_old
  WHERE rn = 1 AND duplicateOf IS NOT NULL
);

UPDATE items_v2
SET duplicateOf = NULL
WHERE duplicateOf = id;

-- 5) Swap tables
ALTER TABLE items RENAME TO items_old;
ALTER TABLE submissions RENAME TO submissions_old;
ALTER TABLE suggestions RENAME TO suggestions_old;

ALTER TABLE items_v2 RENAME TO items;
ALTER TABLE submissions_v2 RENAME TO submissions;
ALTER TABLE suggestions_v2 RENAME TO suggestions;

DROP TABLE submissions_old;
DROP TABLE suggestions_old;
DROP TABLE items_old;

-- 6) Recreate indexes
CREATE INDEX idx_items_updated ON items(updatedAt DESC);
CREATE INDEX idx_items_flagged_updated ON items(flaggedForReview, updatedAt DESC);
CREATE INDEX idx_items_type_flagged ON items(type, flaggedForReview);

CREATE INDEX idx_submissions_item ON submissions(itemId);
CREATE INDEX idx_submissions_item_user ON submissions(itemId, submittedByUserId);
CREATE INDEX idx_submissions_submitter_key ON submissions(submittedByKey);
CREATE INDEX idx_submissions_submitted_at ON submissions(submittedAt DESC);

CREATE INDEX idx_suggestions_item ON suggestions(itemId);
CREATE INDEX idx_suggestions_status_created ON suggestions(status, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_api_tokens_userId ON api_tokens(userId);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_tokens_hash_active ON api_tokens(tokenHash) WHERE revokedAt IS NULL;

-- 7) FTS5 setup + sync triggers
DROP TRIGGER IF EXISTS items_ai;
DROP TRIGGER IF EXISTS items_ad;
DROP TRIGGER IF EXISTS items_au;
DROP TABLE IF EXISTS items_fts;

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

INSERT INTO items_fts(items_fts) VALUES('rebuild');

-- Verification queries (run manually)
-- SELECT 'items' AS table_name, COUNT(*) AS row_count FROM items
-- UNION ALL
-- SELECT 'submissions', COUNT(*) FROM submissions
-- UNION ALL
-- SELECT 'suggestions', COUNT(*) FROM suggestions;
--
-- SELECT COUNT(*) AS duplicate_identity_keys
-- FROM (
--   SELECT identityKey FROM items GROUP BY identityKey HAVING COUNT(*) > 1
-- );
--
-- PRAGMA foreign_key_check;
--
-- SELECT id, name FROM items WHERE rowid IN (
--   SELECT rowid FROM items_fts WHERE items_fts MATCH 'sword*'
-- ) LIMIT 10;
