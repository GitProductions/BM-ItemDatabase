import { z, ParseResult, parseWithSchema, safeJson } from './common';

const nonEmptyString = z.string().trim().min(1);

export const suggestionBodySchema = z
  .strictObject({
    itemId: nonEmptyString,
    note: nonEmptyString,
    proposer: z.string().optional(),
    reason: z.string().optional(),
  })
  .openapi('SuggestionBody');

export type SuggestionRequest = z.infer<typeof suggestionBodySchema>;

export const parseSuggestionBody = async (request: Request): Promise<ParseResult<SuggestionRequest>> => {
  const payload = await safeJson(request);
  if (payload.ok === false) return { ok: false, message: payload.message };
  return parseWithSchema(suggestionBodySchema, payload.data);
};
