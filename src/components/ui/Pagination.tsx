"use client";

import React from "react";
import Button from "./Button";

type PaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export const Pagination: React.FC<PaginationProps> = ({ total, page, pageSize, onPageChange, className }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const siblings = 3;
  const start = Math.max(1, currentPage - siblings);
  const end = Math.min(totalPages, currentPage + siblings);
  const pages = range(start, end);

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className ?? ""}`}>
      <Button variant="secondary" size="sm" onClick={() => onPageChange(1)} disabled={!canPrev}>
        « First
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={!canPrev}>
        ‹ Prev
      </Button>

      {pages.map((p) => (
        <Button
          key={p}
          variant={p === currentPage ? "primary" : "secondary"}
          size="sm"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      <Button variant="secondary" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={!canNext}>
        Next ›
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onPageChange(totalPages)} disabled={!canNext}>
        Last »
      </Button>

      <span className="text-xs text-zinc-500 ml-1">
        Page {currentPage} of {totalPages} • {total} items
      </span>
    </div>
  );
};

export default Pagination;
