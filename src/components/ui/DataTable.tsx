"use client";

import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from "lucide-react";
import React, { useEffect, useRef } from "react";

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

  /** Fixed width, or a width derived from the currently rendered rows. */
  width?: string | ((data: T[]) => string);

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
  /**
   * When set with row expansion, renders this many leading `columns` to the left of the chevron column
   * (e.g. `1` places the row index before the expand control).
   */
  expansionAfterColumnCount?: number;
  /** When false, the table renders without a header row (e.g. nested detail rows under a parent table). */
  showHeader?: boolean;
  /** Prepends a narrow column with a vertical underline (e.g. child rows under an expanded parent). */
  leadingRail?: boolean;
  /** Flattens chrome so the table reads as a continuation of the parent (no outer border/radius). */
  embedded?: boolean;
  /** Highlights the row whose id matches `getRowId(row)`. */
  selectedRowId?: string | number | null;
  /** Invoked when the user clicks a body row (not on nested controls). */
  onRowClick?: (row: T, rowIndex: number) => void;
};

/** Applied on `<td>` cells — row `<tr>` backgrounds are unreliable with `border-collapse`. */
const DATA_TABLE_ROW_SELECTED_CLASS = "bg-primary-soft";

function shouldIgnoreDataTableRowClick(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return Boolean(
    target.closest("button, input, textarea, select, a, label"),
  );
}

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
  expansionAfterColumnCount,
  showHeader = true,
  leadingRail = false,
  embedded = false,
  selectedRowId = null,
  onRowClick,
}: DataTableProps<T>) {
  const isFill = maxHeight === "fill";
  const isExpand = maxHeight === "expand";
  const shouldScrollInternally = Boolean(maxHeight) && (isFill || !isExpand);
  const dict = useDict();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const expansionEnabled =
    Boolean(getRowId) &&
    typeof onToggleExpandRow === "function" &&
    typeof renderExpandedRow === "function";
  const expansionSplit =
    expansionEnabled &&
    expansionAfterColumnCount !== undefined &&
    expansionAfterColumnCount > 0;
  const columnsBeforeExpansion = expansionSplit
    ? columns.slice(0, expansionAfterColumnCount)
    : [];
  const columnsAfterExpansion = expansionSplit
    ? columns.slice(expansionAfterColumnCount)
    : columns;
  const railColumnCount = leadingRail ? 1 : 0;
  const columnCount =
    railColumnCount +
    (showIndex ? 1 : 0) +
    columns.length +
    (expansionEnabled ? 1 : 0);

  const boundedHeight = Boolean(maxHeight) && !isFill && !isExpand;

  function resolveColumnWidth(column: Column<T>): string | undefined {
    return typeof column.width === "function"
      ? column.width(data)
      : column.width;
  }

  useEffect(
    function scrollSelectedRowIntoView(): void {
      if (selectedRowId == null || !scrollContainerRef.current) {
        return;
      }

      const rowId = String(selectedRowId);
      const rowElement = scrollContainerRef.current.querySelector(
        `[data-row-id="${rowId}"]`,
      );

      if (rowElement instanceof HTMLElement) {
        rowElement.scrollIntoView({ block: "nearest" });
        rowElement.focus({ preventScroll: true });
      }
    },
    [data, selectedRowId],
  );

  function renderSortableHeaderTh(
    column: Column<T>,
    headerIndex: number,
  ): React.ReactElement {
    const isSorted =
      sortField && (column.field ?? column.id) === sortField;
    const columnWidth = resolveColumnWidth(column);

    return (
      <th
        key={column.id ?? column.header ?? headerIndex}
        style={
          columnWidth
            ? { width: columnWidth, minWidth: columnWidth }
            : undefined
        }
        className={clsx(
          "px-2 py-2 font-medium text-muted transition-colors",
          column.sortable &&
            "cursor-pointer select-none hover:bg-hover hover:text-text",
          isSorted && "text-text",
          column.thClassName,
        )}
        onClick={() => {
          if (!column.sortable || !onSort) return;

          const key = column.field ?? column.id;
          if (key) onSort(key as keyof T | string);
        }}
      >
        <span
          className={clsx(
            "flex w-full items-center gap-1.5",
            column.align === "right" && "justify-end",
            column.align === "center" && "justify-center",
          )}
        >
          {column.icon && (
            <span className="flex items-center text-muted">{column.icon}</span>
          )}

          <span>{column.header}</span>

          {column.sortable && isSorted && (
            sortDirection === "asc" ? (
              <ArrowUp className="h-3 w-3 text-text" />
            ) : (
              <ArrowDown className="h-3 w-3 text-text" />
            )
          )}
        </span>
      </th>
    );
  }

  function renderDataCell(
    column: Column<T>,
    columnIndex: number,
    row: T,
    rowIndex: number,
    isRowSelected: boolean,
  ): React.ReactElement {
    const content = column.accessor
      ? column.accessor(row, rowIndex)
      : column.field
        ? ((row as Record<string, unknown>)[
            String(column.field)
          ] as React.ReactNode)
        : null;
    const columnWidth = resolveColumnWidth(column);

    return (
      <td
        key={(column.id ?? column.header ?? columnIndex) + "-" + columnIndex}
        style={
          columnWidth
            ? { width: columnWidth, minWidth: columnWidth }
            : undefined
        }
        className={clsx(
          "truncate whitespace-nowrap px-2 py-2 align-middle text-text",
          column.align === "right" && "text-right",
          column.align === "center" && "text-center",
          isRowSelected && DATA_TABLE_ROW_SELECTED_CLASS,
          column.tdClassName,
        )}
      >
        {content}
      </td>
    );
  }

  function renderExpansionHeaderCell(): React.ReactElement {
    return (
      <th
        className="w-7 min-w-[1.75rem] py-2 pl-0.5 pr-0 text-left text-muted"
        aria-hidden
      />
    );
  }

  function renderExpansionBodyCell(
    rid: string | number,
    isExpanded: boolean,
    rowCanExpand: boolean,
    isRowSelected: boolean,
  ): React.ReactElement {
    return (
      <td
        className={clsx(
          "flex w-7 min-w-[1.75rem] items-center justify-center py-2",
          isRowSelected && DATA_TABLE_ROW_SELECTED_CLASS,
        )}
      >
        {rowCanExpand ? (
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded text-muted hover:bg-hover hover:text-text"
            aria-expanded={isExpanded}
            aria-label={dict.expandRow}
            onClick={function handleToggleExpand(): void {
              onToggleExpandRow?.(rid);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span
            className="inline-flex h-5 w-5 items-center justify-center text-muted"
            aria-hidden
          >
            —
          </span>
        )}
      </td>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
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
          {leadingRail && <col className="w-[28px]" />}
          {expansionSplit &&
            columnsBeforeExpansion.map(function renderColBefore(c, idx) {
              return (
                <col
                  key={String(c.id ?? c.header ?? `before-${idx}`)}
                  style={{ width: resolveColumnWidth(c) }}
                  className={c.thClassName}
                />
              );
            })}
          {expansionEnabled && <col className="w-7 min-w-[1.75rem]" />}
          {showIndex && <col className="w-12" />}
          {expansionSplit
            ? columnsAfterExpansion.map(function renderColAfter(c, idx) {
                return (
                  <col
                    key={String(c.id ?? c.header ?? `after-${idx}`)}
                    style={{ width: resolveColumnWidth(c) }}
                    className={c.thClassName}
                  />
                );
              })
            : columns.map(function renderColgroupColumn(c, idx) {
                return (
                  <col
                    key={String(c.id ?? c.header ?? idx)}
                    style={{ width: resolveColumnWidth(c) }}
                    className={c.thClassName}
                  />
                );
              })}
        </colgroup>

        {showHeader && (
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border">
              {leadingRail && (
                <th className="w-[28px] py-2 pl-1 pr-0 text-left" aria-hidden />
              )}

              {expansionSplit &&
                columnsBeforeExpansion.map((c, idx) =>
                  renderSortableHeaderTh(c, idx),
                )}

              {expansionEnabled && renderExpansionHeaderCell()}

              {showIndex && (
                <th className="w-8 py-2 pl-3 pr-2 text-left text-muted">
                  #
                </th>
              )}

              {expansionSplit
                ? columnsAfterExpansion.map((c, idx) =>
                    renderSortableHeaderTh(
                      c,
                      columnsBeforeExpansion.length + idx,
                    ),
                  )
                : columns.map((c, idx) => renderSortableHeaderTh(c, idx))}
            </tr>
          </thead>
        )}

        {/* BODY */}
        <tbody>

          {loading ? (
            <tr>
              {leadingRail && (
                <td
                  className="w-[28px] border-l-2 border-primary/35 bg-muted/20 align-top"
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
                  className="w-[28px] border-l-2 border-primary/35 bg-muted/20 align-top"
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

              const isRowSelected =
                selectedRowId != null && String(selectedRowId) === String(rid);
              const isRowClickable = typeof onRowClick === "function";

              return (
                <React.Fragment key={rid}>
                  <tr
                    data-row-id={String(rid)}
                    aria-selected={isRowSelected}
                    tabIndex={isRowClickable ? -1 : undefined}
                    className={clsx(
                      "h-10 border-b border-border transition-colors outline-none",
                      !embedded && !isRowSelected && "hover:bg-hover",
                      embedded &&
                        !isRowSelected &&
                        "bg-muted/20 hover:bg-muted/30",
                      isRowClickable && "cursor-pointer",
                    )}
                    onClick={
                      isRowClickable
                        ? function handleRowClick(event): void {
                            if (shouldIgnoreDataTableRowClick(event.target)) {
                              return;
                            }
                            onRowClick(row, rIdx);
                            event.currentTarget.focus({ preventScroll: true });
                          }
                        : undefined
                    }
                  >
                    {leadingRail && (
                      <td
                        className={clsx(
                          "w-[28px] border-l-2 border-primary/35 align-middle",
                          isRowSelected
                            ? DATA_TABLE_ROW_SELECTED_CLASS
                            : "bg-muted/20",
                        )}
                        aria-hidden
                      />
                    )}

                    {expansionSplit &&
                      columnsBeforeExpansion.map((c, cIdx) =>
                        renderDataCell(c, cIdx, row, rIdx, isRowSelected),
                      )}

                    {expansionEnabled &&
                      renderExpansionBodyCell(
                        rid,
                        isExpanded,
                        rowCanExpand,
                        isRowSelected,
                      )}

                    {showIndex && (
                      <td
                        className={clsx(
                          "w-12 py-2 pl-3 pr-2 text-muted",
                          isRowSelected && DATA_TABLE_ROW_SELECTED_CLASS,
                        )}
                      >
                        {rIdx + 1}
                      </td>
                    )}

                    {expansionSplit
                      ? columnsAfterExpansion.map((c, cIdx) =>
                          renderDataCell(
                            c,
                            columnsBeforeExpansion.length + cIdx,
                            row,
                            rIdx,
                            isRowSelected,
                          ),
                        )
                      : columns.map((c, cIdx) =>
                          renderDataCell(c, cIdx, row, rIdx, isRowSelected),
                        )}

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
