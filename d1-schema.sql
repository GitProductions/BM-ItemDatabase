-- D1 schema bootstrap 
-- Note: This file does not include ALTER TABLE statements.
-- Run targeted migrations separately when adding columns.

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_identity ON items(name, keywords, type);

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

CREATE INDEX IF NOT EXISTS idx_submissions_item_user ON submissions(itemId, submittedByUserId);

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  proposer TEXT,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suggestions_itemId ON suggestions(itemId);

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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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

CREATE INDEX IF NOT EXISTS idx_api_tokens_userId ON api_tokens(userId);
