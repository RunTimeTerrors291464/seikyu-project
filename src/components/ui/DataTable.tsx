"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import React from "react";

export type SortDirection = "asc" | "desc";

export type Column<T> = {
  id?: string;
  header: string;
  icon?: React.ReactNode;

  accessor?: (row: T, index: number) => React.ReactNode;
  field?: keyof T;

  align?: "left" | "right" | "center";

  thClassName?: string;
  tdClassName?: string;

  width?: string;

  sortable?: boolean;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];

  getRowId?: (row: T, index: number) => string | number;

  showIndex?: boolean;

  className?: string;

  emptyMessage?: string;

  maxHeight?: string | "fill";

  /* sorting */

  sortField?: keyof T;
  sortDirection?: SortDirection;

  onSort?: (field: keyof T) => void;
};

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  showIndex = false,
  className,
  emptyMessage = "No records",
  maxHeight,

  sortField,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  const isFill = maxHeight === "fill";

  return (
    <div
      className={clsx(
        "w-full overflow-auto rounded-lg border border-border bg-card",
        isFill && "h-full",
        className
      )}
      style={maxHeight && !isFill ? { maxHeight } : undefined}
    >
      <table className="w-full table-fixed border-collapse text-sm">

        {/* HEADER */}

        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">

            {showIndex && (
              <th className="w-12 py-2 pl-3 pr-2 text-left text-muted">
                #
              </th>
            )}

            {columns.map((c, idx) => {
              const isSorted =
                sortField && c.field && sortField === c.field;

              return (
                <th
                  key={c.id ?? c.header ?? idx}
                  style={c.width ? { width: c.width } : undefined}
                  className={clsx(
                    "px-2 py-2 text-left font-medium text-muted",
                    c.sortable && "cursor-pointer select-none",
                    c.thClassName
                  )}
                  onClick={() => {
                    if (c.sortable && c.field && onSort) {
                      onSort(c.field);
                    }
                  }}
                >
                  <span className="flex items-center gap-1.5">

                    {c.icon && (
                      <span className="text-muted">
                        {c.icon}
                      </span>
                    )}

                    <span className="truncate">
                      {c.header}
                    </span>

                    {/* SORT ICON */}

                    {c.sortable && isSorted && (
                      <>
                        {sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </>
                    )}

                  </span>
                </th>
              );
            })}

          </tr>
        </thead>

        {/* BODY */}

        <tbody>

          {data.length === 0 ? (
            <tr>
              <td
                colSpan={(showIndex ? 1 : 0) + columns.length}
                className="py-6 text-center text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => {

              const rid = getRowId
                ? getRowId(row, rIdx)
                : rIdx;

              return (
                <tr
                  key={rid}
                  className="h-10 border-b border-border last:border-0 hover:bg-border"
                >

                  {showIndex && (
                    <td className="w-12 py-2 pl-3 pr-2 text-muted">
                      {rIdx + 1}
                    </td>
                  )}

                  {columns.map((c, cIdx) => {

                    const content = c.accessor
                      ? c.accessor(row, rIdx)
                      : c.field
                        ? (
                          (row as Record<string, unknown>)[
                          String(c.field)
                          ] as React.ReactNode
                        )
                        : null;

                    return (
                      <td
                        key={(c.id ?? c.header ?? cIdx) + "-" + cIdx}
                        className={clsx(
                          "px-2 py-2 align-middle text-text truncate whitespace-nowrap",
                          c.align === "right" && "text-right",
                          c.align === "center" && "text-center",
                          c.tdClassName
                        )}
                      >
                        {content}
                      </td>
                    );

                  })}

                </tr>
              );
            })
          )}

        </tbody>

      </table>
    </div>
  );
}