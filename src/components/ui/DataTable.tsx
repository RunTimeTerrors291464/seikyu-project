"use client";

import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from "lucide-react";
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

  /**
   * Controls the wrapper height/scroll behavior:
   * - `undefined`: natural table height (no internal scrolling behavior configured).
   * - `"fill"`: grow to fill the parent container height and enable internal scroll
   *   (so the table header can stay visible via `position: sticky`).
   * - `"expand"`: expand to fit all rows; no internal scrolling (page scrolls instead).
   * - any other string: treat it as a custom height (e.g. `"240px"`) and enable internal scrolling.
   */
  maxHeight?: string | "fill" | "expand";

  sortField?: keyof T | string;
  sortDirection?: SortDirection;

  onSort?: (field: keyof T | string) => void;

  /** When set with `renderExpandedRow`, shows a chevron column and an extra `<tr>` per expanded row. */
  expandedRowIds?: ReadonlySet<string | number>;
  onToggleExpandRow?: (rowId: string | number) => void;
  renderExpandedRow?: (row: T, rowIndex: number) => React.ReactNode;
  /** When omitted, every row may expand. */
  canExpandRow?: (row: T, rowIndex: number) => boolean;
  /** When false, the table renders without a header row (e.g. nested detail rows under a parent table). */
  showHeader?: boolean;
  /** Prepends a narrow column with a vertical underline (e.g. child rows under an expanded parent). */
  leadingRail?: boolean;
  /** Flattens chrome so the table reads as a continuation of the parent (no outer border/radius). */
  embedded?: boolean;
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
  expandedRowIds,
  onToggleExpandRow,
  renderExpandedRow,
  canExpandRow,
  showHeader = true,
  leadingRail = false,
  embedded = false,
}: DataTableProps<T>) {
  const isFill = maxHeight === "fill";
  const isExpand = maxHeight === "expand";
  const shouldScrollInternally = Boolean(maxHeight) && (isFill || !isExpand);
  const dict = useDict();
  const expansionEnabled =
    Boolean(getRowId) &&
    typeof onToggleExpandRow === "function" &&
    typeof renderExpandedRow === "function";
  const railColumnCount = leadingRail ? 1 : 0;
  const columnCount =
    railColumnCount +
    (showIndex ? 1 : 0) +
    columns.length +
    (expansionEnabled ? 1 : 0);

  const boundedHeight = Boolean(maxHeight) && !isFill && !isExpand;

  return (
    <div
      className={clsx(
        // isExpand ? "overflow-visible" : "overflow-auto",
        embedded
          ? "rounded-none border-0 bg-transparent"
          : "rounded-lg border border-border bg-card",
        "",
        // `sticky` headers require a scrolling ancestor (not the `<table>`).
        shouldScrollInternally && "overflow-x-auto overflow-y-auto",
        isFill && "flex-1 min-h-0 min-w-0",
        boundedHeight && "min-h-0",
        className
      )}
      style={boundedHeight ? { maxHeight } : undefined}
    >
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          {leadingRail && <col className="w-8" />}
          {expansionEnabled && <col className="w-8" />}
          {showIndex && <col className="w-12" />}
          {columns.map(function renderColgroupColumn(c, idx) {
            return (
              <col
                key={String(c.id ?? c.header ?? idx)}
                style={c.width ? { width: c.width } : undefined}
                className={c.thClassName}
              />
            );
          })}
        </colgroup>

        {showHeader && (
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border">

              {leadingRail && (
                <th className="w-8 py-2 pl-1 pr-0 text-left" aria-hidden />
              )}

              {expansionEnabled && (
                <th className="w-8 py-2 pl-1 pr-0 text-left text-muted" aria-hidden />
              )}

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
                        <span className="flex items-center text-muted">
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
        )}

        {/* BODY */}
        <tbody>

          {loading ? (
            <tr>
              {leadingRail && (
                <td
                  className="w-8 border-l-2 border-primary/35 bg-muted/20 py-10 pl-1 pr-0 align-top"
                  aria-hidden
                />
              )}
              <td
                colSpan={columnCount - railColumnCount}
                className="py-10 text-center text-muted"
              >
                {dict.loading}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              {leadingRail && (
                <td
                  className="w-8 border-l-2 border-primary/35 bg-muted/20 py-6 pl-1 pr-0 align-top"
                  aria-hidden
                />
              )}
              <td
                colSpan={columnCount - railColumnCount}
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

              const rowCanExpand =
                canExpandRow === undefined || canExpandRow(row, rIdx);

              const isExpanded =
                expansionEnabled &&
                rowCanExpand &&
                expandedRowIds?.has(rid) === true;

              return (
                <React.Fragment key={rid}>
                  <tr
                    className={clsx(
                      "h-10 border-b border-border transition-colors",
                      !embedded && "hover:bg-hover",
                      embedded && "bg-muted/20 hover:bg-muted/30",
                    )}
                  >
                    {leadingRail && (
                      <td
                        className="w-8 border-l-2 border-primary/35 bg-muted/20 py-2 pl-1 pr-0 align-middle"
                        aria-hidden
                      />
                    )}

                    {expansionEnabled && getRowId && onToggleExpandRow && (
                      <td className="w-8 py-2 pl-1 pr-0 align-middle">
                        {rowCanExpand ? (
                          <button
                            type="button"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-text"
                            aria-expanded={isExpanded}
                            aria-label={dict.expandRow}
                            onClick={function handleToggleExpand(): void {
                              onToggleExpandRow(rid);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span
                            className="inline-flex h-6 w-6 items-center justify-center text-muted"
                            aria-hidden
                          >
                            —
                          </span>
                        )}
                      </td>
                    )}

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

                  {expansionEnabled &&
                    isExpanded &&
                    renderExpandedRow && (
                      <tr className="border-b border-border bg-muted/30 last:border-0">
                        <td
                          colSpan={columnCount}
                          className="p-0 align-top text-text"
                        >
                          {renderExpandedRow(row, rIdx)}
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              );
            })
          )}

        </tbody>

      </table>
    </div>
  );
}