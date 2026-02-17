import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z, ZodError, ZodTypeAny } from 'zod';

extendZodWithOpenApi(z);

export { z };

export type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

export const safeJson = async (request: Request): Promise<ParseResult<unknown>> => {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false, message: 'Invalid request payload' };
  }
};

export const zodErrorMessage = (error: ZodError, fallback = 'Invalid request payload') => {
  const issue = error.issues[0];
  if (!issue) return fallback;
  const path = issue.path.length ? issue.path.join('.') : 'body';
  return `${path}: ${issue.message}`;
};

export const parseWithSchema = <TSchema extends ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  fallbackMessage = 'Invalid request payload',
): ParseResult<z.infer<TSchema>> => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: zodErrorMessage(parsed.error, fallbackMessage) };
  }
  return { ok: true, data: parsed.data };
};

export const searchParamsToObject = (searchParams: URLSearchParams) =>
  Object.fromEntries(searchParams.entries());

export const optionalNumericParam = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().finite().optional(),
);
