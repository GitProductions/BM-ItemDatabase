import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

const DB_BINDING = 'ITEMS_DB';

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<unknown>;
  all: <T = unknown>() => Promise<{ results?: T[]; rows?: T[] }>;
};

type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
};

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiTokenRecord = {
  id: string;
  userId: string;
  label: string | null;
  tokenHash: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const getDatabase = async () => {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as Record<string, unknown>)[DB_BINDING];
  if (!db) throw new Error(`Missing D1 binding "${DB_BINDING}". Check wrangler.jsonc d1_databases.`);
  return db as D1Database;
};

let schemaReady: Promise<void> | null = null;
const ensureSchema = async (db: D1Database) => {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db
        .prepare(
          `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            passwordHash TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
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

      await db.prepare('CREATE INDEX IF NOT EXISTS idx_api_tokens_userId ON api_tokens(userId);').run();
      await db.prepare('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);').run();
    })();
  }

  return schemaReady;
};

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const generateId = () => (crypto.randomUUID ? crypto.randomUUID() : randomBytes(16).toString('hex'));

export const createUser = async (params: { email: string; name: string; password: string }) => {
  const db = await getDatabase();
  await ensureSchema(db);

  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();

  if (!email || !name || !params.password) throw new Error('Missing required fields');

  const existing = await findUserByEmail(email);
  if (existing) throw new Error('Email already registered');

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(params.password, 12);
  const id = generateId();

  await db
    .prepare(
      `
      INSERT INTO users (id, email, name, passwordHash, createdAt, updatedAt)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6);
    `,
    )
    .bind(id, email, name, passwordHash, now, now)
    .run();

  return { id, email, name, passwordHash, createdAt: now, updatedAt: now } satisfies UserRecord;
};

export const findUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const db = await getDatabase();
  await ensureSchema(db);
  const result = await db.prepare('SELECT * FROM users WHERE email = ?1 LIMIT 1;').bind(email.toLowerCase()).all<UserRecord>();
  const row = (result.results ?? result.rows ?? [])[0] as UserRecord | undefined;
  return row ?? null;
};

export const findUserById = async (id: string): Promise<UserRecord | null> => {
  const db = await getDatabase();
  await ensureSchema(db);
  const result = await db.prepare('SELECT * FROM users WHERE id = ?1 LIMIT 1;').bind(id).all<UserRecord>();
  const row = (result.results ?? result.rows ?? [])[0] as UserRecord | undefined;
  return row ?? null;
};

export const verifyPassword = async (password: string, passwordHash: string) => bcrypt.compare(password, passwordHash);

export const createApiToken = async (params: { userId: string; label?: string }) => {
  const db = await getDatabase();
  await ensureSchema(db);

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  const id = generateId();

  await db
    .prepare(
      `
      INSERT INTO api_tokens (id, userId, label, tokenHash, createdAt, lastUsedAt, revokedAt)
      VALUES (?1, ?2, ?3, ?4, ?5, NULL, NULL);
    `,
    )
    .bind(id, params.userId, params.label ?? null, tokenHash, now)
    .run();

  return { token, record: { id, userId: params.userId, label: params.label ?? null, tokenHash, createdAt: now, lastUsedAt: null, revokedAt: null } as ApiTokenRecord };
};

export const listApiTokens = async (userId: string): Promise<ApiTokenRecord[]> => {
  const db = await getDatabase();
  await ensureSchema(db);
  const result = await db.prepare('SELECT * FROM api_tokens WHERE userId = ?1 AND revokedAt IS NULL ORDER BY createdAt DESC;').bind(userId).all<ApiTokenRecord>();
  return (result.results ?? result.rows ?? []) as ApiTokenRecord[];
};

export const revokeApiToken = async (userId: string, tokenId: string) => {
  const db = await getDatabase();
  await ensureSchema(db);
  const now = new Date().toISOString();
  await db.prepare('UPDATE api_tokens SET revokedAt = ?1 WHERE id = ?2 AND userId = ?3;').bind(now, tokenId, userId).run();
};

export const verifyApiToken = async (token: string): Promise<UserRecord | null> => {
  const db = await getDatabase();
  await ensureSchema(db);
  const hash = hashToken(token);
  const result = await db
    .prepare('SELECT userId, revokedAt FROM api_tokens WHERE tokenHash = ?1 LIMIT 1;')
    .bind(hash)
    .all<{ userId: string; revokedAt: string | null }>();

  const row = (result.results ?? result.rows ?? [])[0] as { userId: string; revokedAt: string | null } | undefined;
  if (!row || row.revokedAt) return null;

  await db.prepare('UPDATE api_tokens SET lastUsedAt = ?1 WHERE tokenHash = ?2;').bind(new Date().toISOString(), hash).run();

  return findUserById(row.userId);
};

export const hashPersonalToken = hashToken;
