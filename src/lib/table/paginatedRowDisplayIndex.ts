/**
 * Parameters for computing a global 1-based row label on paginated tables.
 */
export type PaginatedRowIndexParams = {
  /** Current page, 1-based. */
  page: number;
  /** Page size (limit). */
  rowsPerPage: number;
};

/**
 * Returns the 1-based display index for a row: `(page - 1) * rowsPerPage + rowIndex + 1`.
 * When `params` is omitted (non-paginated tables), returns `rowIndex + 1`.
 *
 * @param rowIndex - Zero-based index within the current `data` slice.
 * @param params - Optional page and page size.
 */
export function paginatedRowDisplayIndex(
  rowIndex: number,
  params?: PaginatedRowIndexParams,
): number {
  if (params === undefined) {
    return rowIndex + 1;
  }
  const safePage = Math.max(1, params.page);
  const safeLimit = Math.max(1, params.rowsPerPage);
  return (safePage - 1) * safeLimit + rowIndex + 1;
}
