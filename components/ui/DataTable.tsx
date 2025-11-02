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
  width?: string; // tailwind class e.g. w-24 or style width
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowId?: (row: T, index: number) => string | number;
  showIndex?: boolean;
  className?: string;
  emptyMessage?: string;
};

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  showIndex = false,
  className,
  emptyMessage = "No records",
}: DataTableProps<T>) {
  return (
    <div className={clsx("overflow-x-auto", className)}>
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              {showIndex && (
                <th className="w-10 py-2 pl-3 pr-2 text-left text-neutral-500">#</th>
              )}
              {columns.map((c, idx) => (
                <th
                  key={c.id ?? c.header ?? idx}
                  className={clsx(
                    "py-2 px-2 text-left font-medium text-neutral-600 dark:text-neutral-300",
                    c.thClassName
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {c.icon && <span className="text-neutral-400">{c.icon}</span>}
                    <span>{c.header}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={(showIndex ? 1 : 0) + columns.length}
                  className="py-6 text-center text-neutral-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => {
                const rid = getRowId ? getRowId(row, rIdx) : rIdx;
                return (
                  <tr
                    key={rid}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
                  >
                    {showIndex && (
                      <td className="w-10 py-2 pl-3 pr-2 text-neutral-600 dark:text-neutral-300">{rIdx + 1}</td>
                    )}
                    {columns.map((c, cIdx) => {
                      const content = c.accessor
                        ? c.accessor(row, rIdx)
                        : c.field
                        ? ((row as Record<string, unknown>)[String(c.field)] as React.ReactNode)
                        : null;
                      return (
                        <td
                          key={(c.id ?? c.header ?? cIdx) + "-" + cIdx}
                          className={clsx(
                            "py-2 px-2 align-middle text-neutral-700 dark:text-neutral-200",
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
    </div>
  );
}
