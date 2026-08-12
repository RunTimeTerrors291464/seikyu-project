import type { Column } from "@/components/ui/DataTable";
import { Hash } from "lucide-react";

import {
  paginatedRowDisplayIndex,
  type PaginatedRowIndexParams,
} from "./paginatedRowDisplayIndex";

/**
 * Options for {@link rowIndexColumn}.
 */
export type RowIndexColumnOptions = {
  /** When set, cell values use `(page - 1) * rowsPerPage + rowIndex + 1`. */
  pagination?: PaginatedRowIndexParams;
  /**
   * When false, the column is still rendered (Hash header, width) but body cells are empty
   * so nested tables align with a parent row-index column.
   */
  numberRowIndex?: boolean;
};

/**
 * Keeps the row-number column compact while allowing wider labels to fit.
 */
export function rowIndexColumnWidth(
  rowCount: number,
  pagination?: PaginatedRowIndexParams,
): string {
  const lastVisibleRowIndex = Math.max(0, rowCount - 1);
  const largestLabel = paginatedRowDisplayIndex(
    lastVisibleRowIndex,
    pagination,
  );
  const digitCount = String(largestLabel).length;

  return `max(2rem, calc(${digitCount}ch + 1rem))`;
}

/**
 * Standard DataTable column: Hash header, 1-based row labels, optional pagination offset.
 *
 * @param options - Pagination and whether to show numbers vs blank placeholder cells.
 */
export function rowIndexColumn<T>(options?: RowIndexColumnOptions): Column<T> {
  const pagination = options?.pagination;
  const numberRowIndex = options?.numberRowIndex ?? true;

  return {
    id: "rowIndex",
    header: "",
    icon: <Hash className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
    accessor: function renderRowIndex(_row: T, rowIndex: number) {
      if (!numberRowIndex) {
        return (
          <span className="tabular-nums text-muted" aria-hidden>
            {"\u00a0"}
          </span>
        );
      }
      return (
        <span className="tabular-nums text-muted">
          {paginatedRowDisplayIndex(rowIndex, pagination)}
        </span>
      );
    },
    width: function resolveRowIndexWidth(rows): string {
      return rowIndexColumnWidth(rows.length, pagination);
    },
  };
}
