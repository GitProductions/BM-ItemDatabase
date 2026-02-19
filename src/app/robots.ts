import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/account/',
          '/add-item/',
          '/items/*/drops/*', // Submission detail pages (noindex)
        ],
      },
      {
        // Stricter rules for aggressive bots
        userAgent: ['AhrefsSiteAudit', 'SemrushBot', 'DotBot'],
        crawlDelay: 1,
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL}/sitemap.xml`,
  };
}
