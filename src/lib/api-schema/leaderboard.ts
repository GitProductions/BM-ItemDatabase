import { z, ParseResult, parseWithSchema, searchParamsToObject, optionalNumericParam } from './common';

export const leaderboardQuerySchema = z
  .strictObject({
    limit: optionalNumericParam,
  })
  .openapi('LeaderboardQuery');

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export const parseLeaderboardQuery = (searchParams: URLSearchParams): ParseResult<LeaderboardQuery> =>
  parseWithSchema(leaderboardQuerySchema, searchParamsToObject(searchParams), 'Invalid query parameters');
