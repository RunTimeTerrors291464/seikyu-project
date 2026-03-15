"use client";

import clsx from "clsx";
import React from "react";

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
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowId?: (row: T, index: number) => string | number;
  showIndex?: boolean;
  className?: string;
  emptyMessage?: string;

  /**
   * maxHeight options:
   * "400px" | "50vh" | "100%"
   * or "fill" to occupy remaining flex height
   */
  maxHeight?: string | "fill";
};

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  showIndex = false,
  className,
  emptyMessage = "No records",
  maxHeight,
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
      <table className="w-full border-collapse text-sm">

        {/* HEADER */}

        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">

            {showIndex && (
              <th className="w-10 py-2 pl-3 pr-2 text-left text-muted">
                #
              </th>
            )}

            {columns.map((c, idx) => (
              <th
                key={c.id ?? c.header ?? idx}
                className={clsx(
                  "px-2 py-2 text-left font-medium text-muted",
                  c.thClassName
                )}
              >
                <span className="inline-flex items-center gap-1.5">

                  {c.icon && (
                    <span className="text-muted">
                      {c.icon}
                    </span>
                  )}

                  <span>{c.header}</span>

                </span>
              </th>
            ))}

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
                    <td className="w-10 py-2 pl-3 pr-2 text-muted">
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
                          "px-2 py-2 align-middle text-text",
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