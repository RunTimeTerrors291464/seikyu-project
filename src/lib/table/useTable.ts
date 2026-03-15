import { useMemo, useState } from "react";
import { getTotalPages, paginate } from "./pagination";
import { sortData, SortDirection } from "./sort";

export function useTable<T>(data: T[]) {

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [sortField, setSortField] =
    useState<keyof T | undefined>();

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const sortedData = useMemo(() => {

    if (!sortField) return data;

    return sortData(data, sortField, sortDirection);

  }, [data, sortField, sortDirection]);

  const pagedData = useMemo(() => {

    return paginate(sortedData, page, rowsPerPage);

  }, [sortedData, page, rowsPerPage]);

  const totalPages = useMemo(() => {

    return getTotalPages(sortedData.length, rowsPerPage);

  }, [sortedData.length, rowsPerPage]);

  return {

    page,
    setPage,

    rowsPerPage,
    setRowsPerPage,

    sortField,
    setSortField,

    sortDirection,
    setSortDirection,

    data: pagedData,
    totalPages,
    totalRows: sortedData.length
  };
}