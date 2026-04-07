"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;

  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;

  setPage: (page: number) => void;

  totalResults: number;

  dict: {
    page: string;
    of: string;
    result: string;
    results: string;
  };
};

export default function TablePagination({
  page,
  totalPages,
  rowsPerPage,
  setRowsPerPage,
  setPage,
  totalResults,
  dict
}: Props) {

  const rowOptions = [30, 50, 100];

  return (

    <div className="flex items-center gap-3">

      {/* PAGE CONTROL */}

      <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-card text-xs shadow-sm">

        <button
          type="button"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex items-center px-2.5 py-1.5 text-muted hover:bg-bg disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <span className="w-px self-stretch bg-border" />

        <span className="inline-flex items-center px-2.5 py-1.5 text-text">
          {dict.page} {page} {dict.of} {Math.max(1, totalPages)}
        </span>

        <span className="w-px self-stretch bg-border" />

        <button
          type="button"
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center px-2.5 py-1.5 text-muted hover:bg-bg disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

      </div>

      {/* ROWS PER PAGE */}

      <div className="inline-flex items-stretch overflow-hidden rounded-md border border-border bg-card text-xs shadow-sm">

        {rowOptions.map((n, i) => (

          <button
            key={n}
            type="button"
            onClick={() => {
              setRowsPerPage(n);
              setPage(1);
            }}
            className={`inline-flex items-center px-2.5 py-1.5 transition
              ${rowsPerPage === n
                ? "bg-bg font-semibold text-text"
                : "text-muted hover:bg-bg"
              }
              ${i !== rowOptions.length - 1 ? "border-r border-border" : ""}
            `}
          >
            {n}
          </button>

        ))}

      </div>

      {/* RESULTS COUNT */}

      <span className="text-xs text-muted">

        {totalResults}{" "}
        {totalResults === 1
          ? dict.result
          : dict.results}

      </span>

    </div>

  );
}