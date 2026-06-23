"use client";

import Button from "@/components/ui/Buttons";
import DataTable, { type Column, type SortDirection } from "@/components/ui/DataTable";
import TablePagination from "@/components/ui/TablePagination";
import InvoiceListDateRangeFilter from "@/features/invoices/components/InvoiceListDateRangeFilter";
import { useDict } from "@/lib/lang/DictProvider";
import clsx from "clsx";
import { AlertTriangle, Filter, RotateCcw } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type InvoiceListPageShellProps<TRow> = {
  title: string;
  searchInput: ReactNode;
  showFilters: boolean;
  onToggleFilters: () => void;
  onResetFilters: () => void;
  isResetFilterDisabled: boolean;
  toolbarActions?: ReactNode;
  filterGroups?: ReactNode;
  filterGroupsLayout?: "row" | "stack";
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  columns: Column<TRow>[];
  rows: TRow[];
  loading?: boolean;
  error?: string | null;
  getRowId: (row: TRow, index: number) => string | number;
  sortField?: keyof TRow | string;
  sortDirection?: SortDirection;
  onSort?: (field: keyof TRow | string) => void;
  page: number;
  totalPages: number;
  rowsPerPage: number;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onPageChange: (page: number) => void;
  totalResults: number;
  tableProps?: Omit<
    ComponentProps<typeof DataTable<TRow>>,
    | "columns"
    | "data"
    | "loading"
    | "getRowId"
    | "sortField"
    | "sortDirection"
    | "onSort"
    | "maxHeight"
  >;
  footer?: ReactNode;
};

export default function InvoiceListPageShell<TRow>({
  title,
  searchInput,
  showFilters,
  onToggleFilters,
  onResetFilters,
  isResetFilterDisabled,
  toolbarActions,
  filterGroups,
  filterGroupsLayout = "row",
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  columns,
  rows,
  loading = false,
  error,
  getRowId,
  sortField,
  sortDirection,
  onSort,
  page,
  totalPages,
  rowsPerPage,
  onRowsPerPageChange,
  onPageChange,
  totalResults,
  tableProps,
  footer,
}: InvoiceListPageShellProps<TRow>) {
  const dict = useDict();

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <div className="relative z-20 grid grid-cols-3 items-center gap-2">
        <div className="flex items-center justify-start gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        <div className="w-full max-w-xl">{searchInput}</div>

        <div className="flex items-center justify-end gap-2">
          <Button
            icon={<Filter className="h-3.5 w-3.5" />}
            accent={showFilters ? "primary" : "neutral"}
            size="sm"
            onClick={onToggleFilters}
          >
            <span>{dict.filter}</span>
          </Button>

          <Button
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            accent="neutral"
            size="sm"
            onClick={onResetFilters}
            disabled={isResetFilterDisabled}
          >
            {dict.resetFilter}
          </Button>

          {toolbarActions}
        </div>
      </div>

      {showFilters ? (
        <div className="relative z-20 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          {filterGroups ? (
            <div
              className={clsx(
                filterGroupsLayout === "row"
                  ? "flex flex-wrap items-center gap-x-4 gap-y-3"
                  : "flex flex-col gap-y-3",
              )}
            >
              {filterGroups}
            </div>
          ) : null}

          <InvoiceListDateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
          />
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <DataTable<TRow>
        columns={columns}
        data={rows}
        loading={loading}
        getRowId={getRowId}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={onSort}
        maxHeight="fill"
        {...tableProps}
      />

      <TablePagination
        page={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={onRowsPerPageChange}
        setPage={onPageChange}
        totalResults={totalResults}
        dict={dict}
      />

      {footer}
    </div>
  );
}
