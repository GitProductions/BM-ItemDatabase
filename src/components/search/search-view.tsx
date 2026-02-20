"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { DatabaseSearch } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '../ui/PageHeader';
import { Item } from '@/types/items';
import { SLOT_CONFIG, canonicalSlot } from '@/lib/slots';
import { SearchControls } from '../search/search-controls';
import { useSearchResults, PAGE_SIZE } from '../search/use-search-results';
import { ResultsGrid } from '../search/results-grid';
import { EditSuggestionModal } from '../search/edit-suggestion-modal';
import { Pagination } from '../ui/Pagination';
import { getRandomOrcPhrase } from '@/lib/orc-phrases';
import Image from 'next/image';

type SearchViewProps = {
    initialPage?: string;
    initialItems?: Item[];
    initialTotalCount?: number;
    initialResultCount?: number;
};

export const SearchView: React.FC<SearchViewProps> = ({
    initialPage = '1',
    initialItems = [],
    initialTotalCount = 0,
    initialResultCount = 0,
}) => {
    const router = useRouter();
    const {
        search,
        setSearch,
        slotFilter,
        setSlotFilter,
        page,
        // setPage,
        items,
        total,
        totalPages,
        hasResults,
    } = useSearchResults({
        initialPage,
        initialItems,
        initialTotalCount,
        initialResultCount,
    });

    const [suggestItem, setSuggestItem] = useState<Item | null>(null);

    const slotOptions = useMemo(() => {
        const uniq = new Set<string>();
        uniq.add('all');
        SLOT_CONFIG.forEach((slot) => uniq.add(canonicalSlot(slot.key)));
        return Array.from(uniq);
    }, []);

    const handlePrefetch = useCallback(
        (href: string) => {
            router.prefetch(href);
        },
        [router]
    );

    // const handlePageChange = useCallback(
    //     (p: number) => {
    //         setPage(p);
    //         const url = p === 1 ? '/' : `/?page=${p}`;
    //         router.replace(url, { scroll: false });
    //     },
    //     [setPage, router]
    // );

    return (
        <div>
            <PageHeader
                title="Item Database"
                description="Browse, filter, and search the community BlackMUD item database"
                icons={<DatabaseSearch className="text-orange-400" size={24} />}
            />

            <SearchControls
                search={search}
                onSearchChange={setSearch}
                slotFilter={slotFilter}
                onSlotChange={setSlotFilter}
                slotOptions={slotOptions}
            />

            {hasResults ? (
                <>
                    <ResultsGrid items={items} onEdit={setSuggestItem} onPrefetch={handlePrefetch} />
                    <div className="pt-4 flex flex-col items-center gap-1">
                        
                        
                        <Pagination total={total}  pageSize={PAGE_SIZE} basePath="/" />

                        <p className="text-xs text-zinc-500">
                            Page {page} of {totalPages} • {total} items total
                        </p>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-zinc-600">
                    <Image src="/no-results.png" alt="No Results" width={200} height={200} className="mx-auto mb-4" />
                    <p className="text-sm">{getRandomOrcPhrase('noSearchResults', 'random')}</p>
                </div>
            )}

            <EditSuggestionModal item={suggestItem} onClose={() => setSuggestItem(null)} />
        </div>
    );
};
