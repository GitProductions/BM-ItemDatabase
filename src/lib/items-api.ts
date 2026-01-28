import { NextResponse } from 'next/server';
import { Item } from '@/types/items';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const withCors = (response: NextResponse) => {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
};

export const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 11);
};

// Override flags to allow either CSV string or string[]
export type ItemInput = Omit<Partial<Item>, 'flags'> & { flags?: string | string[]; owner?: string }; // allow legacy owner

export const normalizeItemInput = (input: ItemInput) => {
  const name = input.name?.trim();
  const type = input.type?.trim();

  if (!name || !type) {
    return { ok: false as const, message: 'name and type are required.' };
  }

  const flags: string[] =
    Array.isArray(input.flags)
      ? input.flags.map((flag) => String(flag).trim()).filter(Boolean)
      : typeof input.flags === 'string'
        ? input.flags
            .split(',')
            .map((flag) => flag.trim())
            .filter(Boolean)
        : [];

  const rawStats = (input.stats ?? {}) as Item['stats'];
  const affects = Array.isArray(rawStats.affects) ? rawStats.affects.filter(Boolean) : [];

  const submittedBy = (input.submittedBy ?? (input as { owner?: string }).owner)?.trim();

  const item: Item = {
    id: input.id ?? generateId(),
    name,
    keywords: input.keywords?.trim() ?? '',
    type,
    flags,
    stats: {
      ...rawStats,
      affects,
      weight: rawStats.weight ?? 0,
    },
    submittedBy: submittedBy || undefined,
    droppedBy: input.droppedBy?.trim(),
    worn: input.worn?.trim(),
    ego: input.ego,
    isArtifact: Boolean(input.isArtifact),
    raw: input.raw,
    flaggedForReview: input.flaggedForReview,
    duplicateOf: input.duplicateOf,
  };

  return { ok: true as const, item };
};

export const parseBooleanParam = (value: string | null) => {
  if (value === null) return undefined;
  const normalized = value.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return undefined;
};
