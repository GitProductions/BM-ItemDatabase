"use client";

import Link from "next/link";
import React from "react";
import { useSearchParams } from "next/navigation";

type PaginationProps = {
  total: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  className?: string;
  basePath?: string; // used for anchor-based navigation when onPageChange is not provided
  page?: number; // optional prop to override the page from URL, used for non-anchor pagination
};

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

const getPageUrl = (pageNum: number, basePath: string = '/'): string => {
  if (pageNum === 1) return basePath;
  return `${basePath}?page=${pageNum}`;
};

type LinkButtonProps = {
  disabled: boolean;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
};
const LinkButton = ({ disabled, href, onClick, active = false, children }: LinkButtonProps) => {
  if (disabled) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-100 opacity-50 cursor-not-allowed"
      >
        {children}
      </button>
    );
  }

  const activeStyles = active ? 'bg-orange-500 text-black hover:bg-orange-400' : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded ${activeStyles} transition-colors`}
      >
        {children}
      </button>
    );
  }

  if (!href) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded ${activeStyles} transition-colors`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded ${activeStyles} transition-colors`}
    >
      {children}
    </Link>
  );
};

export const Pagination: React.FC<PaginationProps> = ({ total, pageSize, onPageChange, className, basePath = '/', page: propPage }) => {
  const searchParams = useSearchParams();
  const pageFromUrl = Number(searchParams.get("page")) || 1; 
  const page = propPage ?? pageFromUrl; 

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const useAnchors = !onPageChange;

  const goTo = (targetPage: number) => {
    if (!onPageChange) return;
    const clamped = Math.min(Math.max(targetPage, 1), totalPages);
    onPageChange(clamped);
  };

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const siblings = 3;
  const start = Math.max(1, currentPage - siblings);
  const end = Math.min(totalPages, currentPage + siblings);
  const pages = range(start, end);

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className ?? ""}`}>
      <LinkButton
        disabled={!canPrev}
        href={useAnchors ? getPageUrl(1, basePath) : undefined}
        onClick={!useAnchors ? () => goTo(1) : undefined}
      >
        « First
      </LinkButton>
      <LinkButton
        disabled={!canPrev}
        href={useAnchors ? getPageUrl(currentPage - 1, basePath) : undefined}
        onClick={!useAnchors ? () => goTo(currentPage - 1) : undefined}
      >
        ‹ Prev
      </LinkButton>

      {pages.map((p) => (
        <LinkButton
          key={p}
          disabled={false}
          href={useAnchors ? getPageUrl(p, basePath) : undefined}
          onClick={!useAnchors ? () => goTo(p) : undefined}
          active={p === currentPage}
        >
          {p}
        </LinkButton>
      ))}

      <LinkButton
        disabled={!canNext}
        href={useAnchors ? getPageUrl(currentPage + 1, basePath) : undefined}
        onClick={!useAnchors ? () => goTo(currentPage + 1) : undefined}
      >
        Next ›
      </LinkButton>
      <LinkButton
        disabled={!canNext}
        href={useAnchors ? getPageUrl(totalPages, basePath) : undefined}
        onClick={!useAnchors ? () => goTo(totalPages) : undefined}
      >
        Last »
      </LinkButton>

      <span className="text-xs text-zinc-500 ml-1">
        Page {currentPage} of {totalPages} • {total} items
      </span>
    </div>
  );
};

export default Pagination;
