"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import { useState } from "react";

type DropsPaginationProps = {
  total: number;
  pageSize: number;
};

const DropsPagination = ({ total, pageSize }: DropsPaginationProps) => {
  const [page, setPage] = useState(1); 
  const router = useRouter();
  const searchParams = useSearchParams();

  const onPageChange = (nextPage: number) => {
    setPage(nextPage);

    const params = new URLSearchParams(searchParams.toString());
    
    if (nextPage <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(nextPage));
    }
    const suffix = params.toString();
    const nextUrl = suffix ? `?${suffix}` : window.location.pathname;
    router.push(nextUrl);
  };

  return (
    <Pagination
      total={total}
      pageSize={pageSize}
      onPageChange={onPageChange}
      page={page}
      className="justify-center"
    />
  );
};

export default DropsPagination;
