"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';

type DropsPaginationProps = {
  total: number;
  page: number;
  pageSize: number;
};

const DropsPagination = ({ total, page, pageSize }: DropsPaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onPageChange = (nextPage: number) => {
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
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      className="justify-center"
    />
  );
};

export default DropsPagination;
