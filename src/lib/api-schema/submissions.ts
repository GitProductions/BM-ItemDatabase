import { z, ParseResult, parseWithSchema, searchParamsToObject, optionalNumericParam } from './common';

export const submissionsQuerySchema = z
  .strictObject({
    limit: optionalNumericParam,
  })
  .openapi('SubmissionsQuery');

export type SubmissionsQuery = z.infer<typeof submissionsQuerySchema>;

export const parseSubmissionsQuery = (searchParams: URLSearchParams): ParseResult<SubmissionsQuery> =>
  parseWithSchema(submissionsQuerySchema, searchParamsToObject(searchParams), 'Invalid query parameters');
