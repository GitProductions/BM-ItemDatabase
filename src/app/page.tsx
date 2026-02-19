import { ItemDB } from '@/components/database-view';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { fetchItemsVersion, searchItems } from '@/lib/d1';
import { Item } from '@/types/items';

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const params = await searchParams;
  const pageParam = typeof params?.page === 'string' ? params.page : '1';
  const currentPage = Math.max(1, Number.parseInt(pageParam, 10) || 1);

  try {
    // Get total items to calculate total pages
    const versionData = await fetchItemsVersion();
    const totalItems = versionData.totalAll || 0;
    const PAGE_SIZE = 20;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    
    // Clamp current page to valid range
    const validPage = Math.min(currentPage, totalPages);

    return buildPageMetadata({
      title: validPage > 1 ? `Blackmud ItemDB - Page ${validPage}` : "Blackmud ItemDB",
      description: "Item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",
      path: validPage > 1 ? `/?page=${validPage}` : "/",
    });
  } catch (error) {
    console.error('Error generating home page metadata:', error);
    // Fallback metadata
    return buildPageMetadata({
      title: "Blackmud ItemDB",
      description: "Item database for BlackMUD players: Explore player-submitted weapons, armor, and gear - compare stats & check drop history contributed by the community!",
      path: "/",
    });
  }
}

const PAGE_SIZE = 20;

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const pageParam = typeof params?.page === 'string' ? params.page : '1';
  const currentPage = Math.max(1, Number.parseInt(pageParam, 10) || 1);
  const versionData = await fetchItemsVersion();
  const totalItems = versionData.totalAll || 0;

  // Fetch items server-side so they're in initial HTML for crawlers
  let initialItems: Item[] = [];
  try {
    const offset = (currentPage - 1) * PAGE_SIZE;
    initialItems = await searchItems({ limit: PAGE_SIZE, offset });
  } catch (error) {
    console.error('Failed to fetch initial items:', error);
  }

  return (
    <>
      <ItemDB
        initialPage={pageParam}
        initialItems={initialItems}
        initialTotalCount={totalItems}
        initialResultCount={initialItems.length}
      />
    </>
  );
}
