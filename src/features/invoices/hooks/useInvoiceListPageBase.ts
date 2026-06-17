import { useInvoiceListDateRangeFilter } from "@/features/invoices/hooks/useInvoiceListDateRangeFilter";
import type {
  ReturnChildSortField,
  SortOrder,
} from "@/features/invoices/lib/invoiceListSort";
import type { ListDateRangeIso } from "@/lib/datetime/listDateRange";
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

export type { ReturnChildSortField, SortOrder } from "@/features/invoices/lib/invoiceListSort";
export {
  compareNullableString,
  sortReturnChildrenRows,
} from "@/features/invoices/lib/invoiceListSort";

export type InvoiceListPageBaseState = {
  page: number;
  setPage: (page: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (rowsPerPage: number) => void;
  handleRowsPerPageChange: (rowsPerPage: number) => void;
  search: string;
  setSearch: (search: string) => void;
  showFilters: boolean;
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  ruleInputResetKey: number;
  resetRuleInput: () => void;
  resetPagination: () => void;
  fromDate: string;
  toDate: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  listDateRange: Partial<ListDateRangeIso>;
  isDefaultRange: boolean;
  resetDateRange: () => void;
  resetPageOnFilterChange: () => void;
};

/**
 * Shared pagination, search, filter panel, and date-range state for invoice list pages.
 */
export function useInvoiceListPageBase(
  initialRowsPerPage = 30,
): InvoiceListPageBaseState {
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initialRowsPerPage);
  const [search, setSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [ruleInputResetKey, setRuleInputResetKey] = useState<number>(0);
  const {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    listDateRange,
    isDefaultRange,
    resetDateRange,
  } = useInvoiceListDateRangeFilter();

  const resetRuleInput = useCallback(function resetRuleInput(): void {
    setRuleInputResetKey(function bumpKey(value) {
      return value + 1;
    });
  }, []);

  const resetPagination = useCallback(function resetPagination(): void {
    setPage(1);
  }, []);

  const handleRowsPerPageChange = useCallback(function handleRowsPerPageChange(
    value: number,
  ): void {
    setRowsPerPage(value);
    setPage(1);
  }, []);

  const resetPageOnFilterChange = useCallback(function resetPageOnFilterChange(): void {
    setPage(1);
  }, []);

  return {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    handleRowsPerPageChange,
    search,
    setSearch,
    showFilters,
    setShowFilters,
    ruleInputResetKey,
    resetRuleInput,
    resetPagination,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    listDateRange,
    isDefaultRange,
    resetDateRange,
    resetPageOnFilterChange,
  };
}

/**
 * @param defaultSortBy - Initial primary sort field.
 * @param defaultSortOrder - Initial sort direction.
 * @param allowedFields - Fields accepted from the table header.
 * @param onPageReset - Called when sort changes should reset pagination.
 */
export function useInvoiceListSort<TSortField extends string>(
  defaultSortBy: TSortField,
  defaultSortOrder: SortOrder,
  allowedFields: readonly TSortField[],
  onPageReset: () => void,
) {
  const [sortBy, setSortBy] = useState<TSortField>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  const handleSort = useCallback(
    function handleSort(nextField: string): void {
      if (!allowedFields.includes(nextField as TSortField)) {
        return;
      }

      if (sortBy !== nextField) {
        setSortBy(nextField as TSortField);
        setSortOrder("asc");
        onPageReset();
        return;
      }

      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      onPageReset();
    },
    [allowedFields, onPageReset, sortBy, sortOrder],
  );

  const resetSort = useCallback(function resetSort(): void {
    setSortBy(defaultSortBy);
    setSortOrder(defaultSortOrder);
  }, [defaultSortBy, defaultSortOrder]);

  const isDefaultSort =
    sortBy === defaultSortBy && sortOrder === defaultSortOrder;

  return {
    sortBy,
    sortOrder,
    handleSort,
    resetSort,
    isDefaultSort,
  };
}

export function useReturnChildSort(
  defaultSortBy: ReturnChildSortField,
  defaultSortOrder: SortOrder = "desc",
) {
  const [returnSortBy, setReturnSortBy] =
    useState<ReturnChildSortField>(defaultSortBy);
  const [returnSortOrder, setReturnSortOrder] =
    useState<SortOrder>(defaultSortOrder);

  const handleReturnSort = useCallback(function handleReturnSort(
    nextField: string,
  ): void {
    if (
      nextField !== "returnInvoiceId" &&
      nextField !== "userId" &&
      nextField !== "createdAt"
    ) {
      return;
    }

    if (returnSortBy !== nextField) {
      setReturnSortBy(nextField as ReturnChildSortField);
      setReturnSortOrder("asc");
      return;
    }

    setReturnSortOrder(returnSortOrder === "asc" ? "desc" : "asc");
  }, [returnSortBy, returnSortOrder]);

  const resetReturnSort = useCallback(function resetReturnSort(): void {
    setReturnSortBy(defaultSortBy);
    setReturnSortOrder(defaultSortOrder);
  }, [defaultSortBy, defaultSortOrder]);

  const isDefaultReturnSort =
    returnSortBy === defaultSortBy && returnSortOrder === defaultSortOrder;

  return {
    returnSortBy,
    returnSortOrder,
    handleReturnSort,
    resetReturnSort,
    isDefaultReturnSort,
  };
}
