-- D1 Schema Migration: Add parsedItem column to submissions
-- Stores the full parsed Item object (as JSON) at submission time for variant tracking
-- Run with:
--   wrangler d1 execute bm_itemdb --file=./migrations/2026-02-18-add-parsedItem-to-submissions.sql --remote

-- 1) Create new submissions table with parsedItem column
CREATE TABLE submissions_v2 (
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

-- 2) Copy existing data (parsedItem will be populated via backfill script)
INSERT INTO submissions_v2 (id, itemId, identityKey, submittedBy, submittedByKey, submittedByUserId, submittedAt, raw, ipHash, parsedItem)
SELECT id, itemId, identityKey, submittedBy, submittedByKey, submittedByUserId, submittedAt, raw, ipHash, NULL
FROM submissions;

-- 3) Drop old table
DROP TABLE submissions;

-- 4) Rename new table
ALTER TABLE submissions_v2 RENAME TO submissions;

-- 5) Recreate indexes
CREATE INDEX IF NOT EXISTS idx_submissions_item ON submissions(itemId);
CREATE INDEX IF NOT EXISTS idx_submissions_item_user ON submissions(itemId, submittedByUserId);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter_key ON submissions(submittedByKey);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submittedAt DESC);

-- NOTE: After running this migration, execute the backfill script to populate parsedItem from raw:
--   ts-node scripts/backfill-parsed-items.ts
