import { z, ParseResult, parseWithSchema, safeJson } from './common';

const nonEmptyString = z.string().trim().min(1);

export const registerBodySchema = z
  .strictObject({
    email: z.string().trim().email(),
    name: nonEmptyString,
    password: z.string().min(8),
  })
  .openapi('RegisterBody');

export type RegisterRequest = z.infer<typeof registerBodySchema>;

export const parseRegisterBody = async (request: Request): Promise<ParseResult<RegisterRequest>> => {
  const payload = await safeJson(request);
  if (payload.ok === false) return { ok: false, message: payload.message };
  return parseWithSchema(registerBodySchema, payload.data, 'Invalid registration payload');
};
