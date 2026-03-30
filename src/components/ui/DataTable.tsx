"use client";

import { useDict } from "@/lib/lang/DictProvider";
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

  sortAccessor?: (row: T) => string | number;

  align?: "left" | "right" | "center";

  thClassName?: string;
  tdClassName?: string;

  width?: string;

  sortable?: boolean;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];

  loading?: boolean;

  getRowId?: (row: T, index: number) => string | number;

  showIndex?: boolean;

  className?: string;

  emptyMessage?: string;

  maxHeight?: string | "fill";

  sortField?: keyof T | string;
  sortDirection?: SortDirection;

  onSort?: (field: keyof T | string) => void;
};

export default function DataTable<T>({
  columns,
  data,
  loading,
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
  const dict = useDict()
  return (
    <div
      className={clsx(
        "overflow-auto rounded-lg border-border bg-card border",
        isFill && "h-full min-h-0",
        className
      )}
    // style={maxHeight && !isFill ? { maxHeight } : undefined}
    >
      <table className="w-full table-fixed border-collapse text-sm">

        {/* HEADER */}
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">

            {showIndex && (
              <th className="w-8 py-2 pl-3 pr-2 text-left text-muted">
                #
              </th>
            )}

            {columns.map((c, idx) => {
              const isSorted =
                sortField && (c.field ?? c.id) === sortField;

              return (
                <th
                  key={c.id ?? c.header ?? idx}
                  style={c.width ? { width: c.width } : undefined}
                  className={clsx(
                    "px-2 py-2 font-medium text-muted transition-colors",
                    c.sortable &&
                    "cursor-pointer select-none hover:bg-hover hover:text-text",
                    isSorted && "text-text",
                    c.thClassName
                  )}
                  onClick={() => {
                    if (!c.sortable || !onSort) return;

                    const key = c.field ?? c.id;
                    if (key) onSort(key as keyof T | string);
                  }}
                >
                  <span className={clsx(
                    "flex items-center gap-1.5 w-full",
                    c.align === "right" && "justify-end",
                    c.align === "center" && "justify-center"
                  )}>

                    {c.icon && (
                      <span className="text-muted">
                        {c.icon}
                      </span>
                    )}

                    <span>{c.header}</span>

                    {c.sortable && isSorted && (
                      sortDirection === "asc"
                        ? <ArrowUp className="h-3 w-3 text-text" />
                        : <ArrowDown className="h-3 w-3 text-text" />
                    )}

                  </span>
                </th>
              );
            })}

          </tr>
        </thead>

        {/* BODY */}
        <tbody>

          {loading ? (
            <tr>
              <td
                colSpan={(showIndex ? 1 : 0) + columns.length}
                className="py-10 text-center text-muted"
              >
                {dict.loading}
              </td>
            </tr>
          ) : data.length === 0 ? (
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
                  className={clsx(
                    "h-10 border-b border-border last:border-0 transition-colors",
                    "hover:bg-hover"
                  )}
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