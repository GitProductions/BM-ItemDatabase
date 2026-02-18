export const keywordsToSlug = (keywords?: string | null): string => {
  if (!keywords) return 'item';
  const slug = keywords
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace runs of non-alphanum with -
    .replace(/^-+|-+$/g, '') // trim leading/trailing -
    .replace(/-{2,}/g, '-'); // collapse --
  return slug || 'item';
};

export const buildItemPath = (id: string, keywords?: string | null) => {
  const slug = keywordsToSlug(keywords);
  return `/items/${id}/${slug}`;
};
