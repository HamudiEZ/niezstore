"use client";

import { useMemo } from "react";

function buildPageItems(page, totalPages, windowSize) {
  if (totalPages <= 0) return [];

  if (totalPages <= windowSize + 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(windowSize / 2);
  let start = Math.max(1, page - halfWindow);
  let end = Math.min(totalPages, start + windowSize - 1);

  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const items = [];

  if (start > 1) {
    items.push(1);
    if (start > 2) items.push("ellipsis-start");
  }

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) items.push("ellipsis-end");
    items.push(totalPages);
  }

  return items;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  windowSize = 5,
  showFirstLast = true,
  className = "",
}) {
  const safeTotalPages =
    Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : 0;

  const safePage = Math.min(Math.max(1, page || 1), Math.max(1, safeTotalPages));
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : null;
  const safeTotalItems = Number.isFinite(totalItems) && totalItems >= 0 ? totalItems : null;

  const startIndex =
    safeTotalItems != null && safePageSize != null
      ? (safePage - 1) * safePageSize + 1
      : null;

  const endIndex =
    safeTotalItems != null && safePageSize != null
      ? Math.min(safeTotalItems, startIndex + safePageSize - 1)
      : null;

  const pageItems = useMemo(
    () => buildPageItems(safePage, Math.max(1, safeTotalPages), windowSize),
    [safePage, safeTotalPages, windowSize]
  );

  /* Allow rendering the summary even on single pages */

  const changePage = (nextPage) => {
    if (!onPageChange) return;
    const normalized = Math.min(Math.max(1, nextPage), safeTotalPages);
    if (normalized === safePage) return;
    onPageChange(normalized);
  };

  return (
    <div className={`pagination-shell ${className}`.trim()}>
      <p className="pagination-summary">
        {startIndex != null && endIndex != null && safeTotalItems != null
          ? `Mostrando ${startIndex}-${endIndex} de ${safeTotalItems}`
          : `Pag ${safePage} / ${safeTotalPages}`}
      </p>

      <div className="pagination-controls">
        {showFirstLast ? (
          <button
            type="button"
            className="pagination-btn"
            onClick={() => changePage(1)}
            disabled={safePage <= 1}
            aria-label="Primera pagina"
            title="Primera pagina"
          >
            {"<<"}
          </button>
        ) : null}

        <button
          type="button"
          className="pagination-btn"
          onClick={() => changePage(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Pagina anterior"
        >
          {"<"}
        </button>

        {pageItems.map((item) => {
          if (typeof item !== "number") {
            return (
              <span key={item} className="pagination-ellipsis" aria-hidden="true">
                ...
              </span>
            );
          }

          return (
            <button
              key={item}
              type="button"
              onClick={() => changePage(item)}
              className={`pagination-btn ${item === safePage ? "pagination-btn--active" : ""}`.trim()}
              aria-label={`Ir a la pagina ${item}`}
              aria-current={item === safePage ? "page" : undefined}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          className="pagination-btn"
          onClick={() => changePage(safePage + 1)}
          disabled={safePage >= safeTotalPages}
          aria-label="Pagina siguiente"
        >
          {">"}
        </button>

        {showFirstLast ? (
          <button
            type="button"
            className="pagination-btn"
            onClick={() => changePage(safeTotalPages)}
            disabled={safePage >= safeTotalPages}
            aria-label="Ultima pagina"
            title="Ultima pagina"
          >
            {">>"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
