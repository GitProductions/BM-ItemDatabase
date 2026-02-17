import { z, ParseResult, parseWithSchema, safeJson, searchParamsToObject, optionalNumericParam } from './common';

export const booleanLikeValues = ['1', '0', 'true', 'false', 'yes', 'no', 'on', 'off'] as const;
export const booleanLikeSchema = z.enum(booleanLikeValues);

const nonEmptyString = z.string().trim().min(1);

export const itemsGetQuerySchema = z
  .strictObject({
    q: z.string().optional(),
    type: z.string().optional(),
    flagged: booleanLikeSchema.optional(),
    id: z.string().optional(),
    limit: optionalNumericParam,
    offset: optionalNumericParam,
  })
  .openapi('ItemsGetQuery');

const itemAffectSchema = z
  .strictObject({
    type: z.enum(['spell', 'stat']).optional(),
    stat: z.string().optional(),
    value: z.number().optional(),
    spell: z.string().optional(),
    level: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  })
  .openapi('ItemAffect');

const itemStatsSchema = z
  .strictObject({
    affects: z.array(itemAffectSchema).optional(),
    damage: z.string().optional(),
    ac: z.number().optional(),
    acMin: z.number().optional(),
    acMax: z.number().optional(),
    weight: z.number().optional(),
    weightMin: z.number().optional(),
    weightMax: z.number().optional(),
    condition: z.string().optional(),
  })
  .openapi('ItemStatsInput');

export const itemInputSchema = z
  .strictObject({
    id: z.string().optional(),
    name: z.string().optional(),
    keywords: z.string().optional(),
    type: z.string().optional(),
    flags: z.union([z.string(), z.array(z.string())]).optional(),
    submittedBy: z.string().optional(),
    submittedByUserId: z.string().optional(),
    droppedBy: z.string().optional(),
    worn: z.union([z.string(), z.array(z.string())]).optional(),
    stats: itemStatsSchema.optional(),
    ego: z.string().optional(),
    egoMin: z.string().optional(),
    egoMax: z.string().optional(),
    isArtifact: z.boolean().optional(),
    raw: z.union([z.string(), z.array(z.string())]).optional(),
    flaggedForReview: z.boolean().optional(),
    duplicateOf: z.string().optional(),
  })
  .openapi('ItemInput');

const itemIdentitySchema = itemInputSchema.extend({
  name: nonEmptyString,
  type: nonEmptyString,
});

const overridesSchema = z.record(z.string(), itemInputSchema.partial()).openapi('ItemOverrides');

const itemsPostArraySchema = z
  .strictObject({
    items: z.array(itemInputSchema).min(1),
    submittedBy: z.string().optional(),
    overrides: overridesSchema.optional(),
  })
  .openapi('ItemsPostArray');

const itemsPostRawSchema = z
  .strictObject({
    raw: nonEmptyString,
    submittedBy: z.string().optional(),
    overrides: overridesSchema.optional(),
  })
  .openapi('ItemsPostRaw');

const itemsPostItemSchema = z
  .strictObject({
    item: itemIdentitySchema,
    submittedBy: z.string().optional(),
    submittedByUserId: z.string().optional(),
  })
  .openapi('ItemsPostItem');

const itemsPostDirectSchema = itemIdentitySchema.openapi('ItemsPostDirect');

export const itemsPostBodySchema = z
  .union([itemsPostArraySchema, itemsPostRawSchema, itemsPostItemSchema, itemsPostDirectSchema])
  .openapi('ItemsPostBody');

const itemsPatchArraySchema = z
  .strictObject({
    items: z.array(itemInputSchema).min(1),
  })
  .openapi('ItemsPatchArray');

const itemsPatchItemSchema = z
  .strictObject({
    item: itemIdentitySchema,
  })
  .openapi('ItemsPatchItem');

const itemsPatchDirectSchema = itemIdentitySchema.openapi('ItemsPatchDirect');

export const itemsPatchBodySchema = z
  .union([itemsPatchArraySchema, itemsPatchItemSchema, itemsPatchDirectSchema])
  .openapi('ItemsPatchBody');

export const itemsDeleteBodySchema = z
  .strictObject({
    id: nonEmptyString,
  })
  .openapi('ItemsDeleteBody');

export const itemsAuthHeaderSchema = z
  .strictObject({
    authorization: z.string().optional(),
  })
  .openapi('ItemsAuthHeader');

export type ItemsGetQuery = z.infer<typeof itemsGetQuerySchema>;
export type ItemsPostRequest = z.infer<typeof itemsPostBodySchema>;
export type ItemsPatchRequest = z.infer<typeof itemsPatchBodySchema>;
export type ItemsDeleteRequest = z.infer<typeof itemsDeleteBodySchema>;

export const parseItemsGetQuery = (searchParams: URLSearchParams): ParseResult<ItemsGetQuery> => {
  const raw = searchParamsToObject(searchParams);
  const parsed = parseWithSchema(itemsGetQuerySchema, raw, 'Invalid query parameters');
  if (!parsed.ok) return parsed;

  const data = parsed.data;
  return {
    ok: true,
    data: {
      ...data,
      q: data.q?.trim() || undefined,
      type: data.type?.trim() || undefined,
      id: data.id?.trim() || undefined,
    },
  };
};

export const parseItemsPostBody = async (request: Request): Promise<ParseResult<ItemsPostRequest>> => {
  const payload = await safeJson(request);
  if (payload.ok === false) return { ok: false, message: payload.message };
  return parseWithSchema(itemsPostBodySchema, payload.data);
};

export const parseItemsPatchBody = async (request: Request): Promise<ParseResult<ItemsPatchRequest>> => {
  const payload = await safeJson(request);
  if (payload.ok === false) return { ok: false, message: payload.message };
  return parseWithSchema(itemsPatchBodySchema, payload.data);
};

export const parseItemsDeleteBody = async (request: Request): Promise<ParseResult<ItemsDeleteRequest>> => {
  const payload = await safeJson(request);
  if (payload.ok === false) return { ok: false, message: payload.message };
  return parseWithSchema(itemsDeleteBodySchema, payload.data);
};
