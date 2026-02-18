/**
 * Shared pagination helper to calculate page bounds.
 */
export const resolvePage = (rawPage: string | undefined, totalItems: number, pageSize: number) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const parsed = Number.parseInt(rawPage ?? '1', 10);
  const page = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), totalPages) : 1;
  const pageStart = (page - 1) * pageSize;

  return { page, totalPages, pageStart };
};
