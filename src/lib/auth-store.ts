import { getCloudflareContext } from '@opennextjs/cloudflare';
import bcrypt from 'bcryptjs';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const DB_BINDING = 'bm_itemdb';

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
  lastIpHash?: string | null;
  lastIpAt?: string | null;
  isAdmin?: number | null;
};

export type ApiTokenRecord = {
  id: string;
  userId: string;
  label: string | null;
  tokenHash: string;
  tokenEnc?: string | null;
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

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const generateId = () => (crypto.randomUUID ? crypto.randomUUID() : randomBytes(16).toString('hex'));

const getTokenKey = () => {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error('TOKEN_SECRET is not set');
  }
  return createHash('sha256').update(secret).digest();
};

const encryptToken = (token: string) => {
  const key = getTokenKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
};

const decryptToken = (payload: string) => {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid token payload');
  const key = getTokenKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
};


// User Management
export const createUser = async (params: {
  email: string;
  name: string;
  password: string;
  id?: string;
  lastIpHash?: string | null;
}) => {
  const db = await getDatabase();

  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();

  if (!email || !name || !params.password) throw new Error('Missing required fields');

  const existing = await findUserByEmail(email);
  if (existing) throw new Error('Email already registered');

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(params.password, 12);
  const id = params.id ?? generateId();

  await db
    .prepare(
      `
      INSERT INTO users (id, email, name, passwordHash, createdAt, updatedAt, isAdmin, lastIpHash, lastIpAt)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);
    `,
    )
    .bind(id, email, name, passwordHash, now, now, 0, params.lastIpHash ?? null, params.lastIpHash ? now : null)
    .run();

  return {
    id,
    email,
    name,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    lastIpHash: params.lastIpHash ?? null,
    lastIpAt: params.lastIpHash ? now : null,
    isAdmin: 0,
  } satisfies UserRecord;
};


export const ensureOAuthUser = async (
  provider: string,
  profile: { id: string; email?: string | null; name?: string | null; lastIpHash?: string | null },
) => {
  const db = await getDatabase();

  const userId = `${provider}:${profile.id}`;
  const existing = await findUserById(userId);
  if (existing) return existing;

  const email = (profile.email ?? `${userId}@${provider}.local`).toLowerCase();
  const name = profile.name?.trim() || `${provider} user`;
  const randomPassword = randomBytes(24).toString('hex');

  // Avoid duplicate email constraint by reusing existing row if same email already registered
  const byEmail = await findUserByEmail(email);
  if (byEmail) return byEmail;

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  await db
    .prepare(
      `
      INSERT INTO users (id, email, name, passwordHash, createdAt, updatedAt, isAdmin, lastIpHash, lastIpAt)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);
    `,
    )
    .bind(userId, email, name, passwordHash, now, now, 0, profile.lastIpHash ?? null, profile.lastIpHash ? now : null)
    .run();

  return {
    id: userId,
    email,
    name,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    lastIpHash: profile.lastIpHash ?? null,
    lastIpAt: profile.lastIpHash ? now : null,
    isAdmin: 0,
  } satisfies UserRecord;
};


export const findUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const db = await getDatabase();
  const result = await db.prepare('SELECT * FROM users WHERE email = ?1 LIMIT 1;').bind(email.toLowerCase()).all<UserRecord>();
  const row = (result.results ?? result.rows ?? [])[0] as UserRecord | undefined;
  return row ?? null;
};

export const findUserById = async (id: string): Promise<UserRecord | null> => {
  const db = await getDatabase();
  const result = await db.prepare('SELECT * FROM users WHERE id = ?1 LIMIT 1;').bind(id).all<UserRecord>();
  const row = (result.results ?? result.rows ?? [])[0] as UserRecord | undefined;
  return row ?? null;
};

export const verifyPassword = async (password: string, passwordHash: string) => bcrypt.compare(password, passwordHash);


export const updateUserIp = async (userId: string, ipHash: string) => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db
    .prepare('UPDATE users SET lastIpHash = ?1, lastIpAt = ?2, updatedAt = ?2 WHERE id = ?3;')
    .bind(ipHash, now, userId)
    .run();
};

export const updateUserName = async (userId: string, name: string) => {
  const db = await getDatabase();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name is required');
  const now = new Date().toISOString();
  await db.prepare('UPDATE users SET name = ?1, updatedAt = ?2 WHERE id = ?3;').bind(trimmed, now, userId).run();
  return trimmed;
};


// API Token Management
export const createApiToken = async (params: { userId: string; label?: string }) => {
  const db = await getDatabase();

  // Ensure user exists to satisfy FK constraint
  const user = await findUserById(params.userId);
  if (!user) {
    throw new Error('Cannot create token: user not found');
  }

  // Enforce single active token per user: revoke any existing active tokens
  const now = new Date().toISOString();
  await db.prepare('UPDATE api_tokens SET revokedAt = ?1 WHERE userId = ?2 AND revokedAt IS NULL;').bind(now, params.userId).run();

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const tokenEnc = encryptToken(token);

  const id = generateId();

  await db
    .prepare(
      `
      INSERT INTO api_tokens (id, userId, label, tokenHash, tokenEnc, createdAt, lastUsedAt, revokedAt)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, NULL);
    `,
    )
    .bind(id, params.userId, params.label ?? null, tokenHash, tokenEnc, now)
    .run();

  return { token, record: { id, userId: params.userId, label: params.label ?? null, tokenHash, tokenEnc, createdAt: now, lastUsedAt: null, revokedAt: null } as ApiTokenRecord };
};

export const listApiTokens = async (userId: string): Promise<ApiTokenRecord[]> => {
  const db = await getDatabase();
  const result = await db.prepare('SELECT * FROM api_tokens WHERE userId = ?1 AND revokedAt IS NULL ORDER BY createdAt DESC;').bind(userId).all<ApiTokenRecord>();
  return (result.results ?? result.rows ?? []) as ApiTokenRecord[];
};

export const revokeApiToken = async (userId: string, tokenId: string) => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.prepare('UPDATE api_tokens SET revokedAt = ?1 WHERE id = ?2 AND userId = ?3;').bind(now, tokenId, userId).run();
};

export const getApiTokenForUser = async (userId: string, tokenId: string): Promise<ApiTokenRecord | null> => {
  const db = await getDatabase();
  const result = await db
    .prepare('SELECT * FROM api_tokens WHERE id = ?1 AND userId = ?2 LIMIT 1;')
    .bind(tokenId, userId)
    .all<ApiTokenRecord>();
  const row = (result.results ?? result.rows ?? [])[0] as ApiTokenRecord | undefined;
  return row ?? null;
};

export const verifyApiToken = async (token: string): Promise<UserRecord | null> => {
  const db = await getDatabase();
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
export const revealPersonalToken = (tokenEnc: string) => decryptToken(tokenEnc);
