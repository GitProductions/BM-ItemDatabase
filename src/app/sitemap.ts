import type { MetadataRoute } from 'next';
import { searchItems } from '@/lib/d1';
import { keywordsToSlug } from '@/lib/slug';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate every 24 hours  - We can look into maybe being able to add a single item to the sitemap every time instead??

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bm-itemdb.gitago.dev';


/**
 * Generate the sitemap for the Item Database
 * Includes static pages and dynamically generated item routes
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const routes = await generateRoutes();
    return routes;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Fallback to static routes only if database query fails
    return getStaticRoutes();
  }
}

/**
 * Generate all routes for the sitemap
 */
async function generateRoutes(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = getStaticRoutes();
  const itemRoutes = await getItemRoutes();

  return [...staticRoutes, ...itemRoutes];
}

/**
 * Static public pages
 */
function getStaticRoutes(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // {
    //   url: `${BASE_URL}/login`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
    {
      url: `${BASE_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/gear-planner`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // {
    //   url: `${BASE_URL}/account`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly',
    //   priority: 0.7,
    // },
    {
      url: `${BASE_URL}/add-item`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return routes;
}

/**
 * Dynamic item routes - fetches recent items from database
 * Generates routes for item detail page and item drop summary page
 */
async function getItemRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch the 500 most recent items
    const items = await searchItems({
      limit: 500,
      offset: 0,
    });

    const routes: MetadataRoute.Sitemap = [];

    items.forEach((item) => {
      // Item detail page with highest priority
      routes.push({
        url: `${BASE_URL}/items/${item.id}/${keywordsToSlug(item.keywords)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });

      // Item drops summary page
      // routes.push({
      //   url: `${BASE_URL}/items/${item.id}/drops`,
      //   lastModified: new Date(),
      //   changeFrequency: 'weekly',
      //   priority: 0.7,
      // });
    });

    return routes;
  } catch (error) {
    console.error('Error fetching items for sitemap:', error);
    return [];
  }
}
