import { useMemo, useState } from "react";
import { getTotalPages, paginate } from "./pagination";

export type SortDirection = "asc" | "desc";

type TableColumn<T> = {
  id?: string;
  field?: keyof T;
  sortAccessor?: (row: T) => any;
};

export function useTable<T>(
  data: T[],
  columns: TableColumn<T>[]
) {

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [sortField, setSortField] =
    useState<keyof T | string | undefined>();

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  /* ---------- SORT ---------- */

  function handleSort(field: keyof T | string) {

    if (sortField === field) {

      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : "asc"
      );

    } else {

      setSortField(field);
      setSortDirection("asc");

    }

  }

  /* ---------- SORTED DATA ---------- */

  const sortedData = useMemo(() => {

    if (!sortField) return data;

    const column = columns.find(
      (c) => c.field === sortField || c.id === sortField
    );

    return [...data].sort((a, b) => {

      let av: any;
      let bv: any;

      if (column?.sortAccessor) {

        av = column.sortAccessor(a);
        bv = column.sortAccessor(b);

      } else {

        av = (a as any)[sortField];
        bv = (b as any)[sortField];

      }

      if (av === bv) return 0;

      if (sortDirection === "asc") {
        return av > bv ? 1 : -1;
      }

      return av < bv ? 1 : -1;

    });

  }, [data, sortField, sortDirection, columns]);

  /* ---------- PAGINATION ---------- */

  const pagedData = useMemo(() => {

    return paginate(sortedData, page, rowsPerPage);

  }, [sortedData, page, rowsPerPage]);

  const totalPages = useMemo(() => {

    return getTotalPages(
      sortedData.length,
      rowsPerPage
    );

  }, [sortedData.length, rowsPerPage]);

  return {

    page,
    setPage,

    rowsPerPage,
    setRowsPerPage,

    sortField,
    sortDirection,
    handleSort,

    data: pagedData,

    totalPages,
    totalRows: sortedData.length

  };
}