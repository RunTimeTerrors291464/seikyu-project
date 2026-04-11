"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import TablePagination from "@/components/ui/TablePagination";
import { STATUS_ACCENT } from "@/features/invoices/components/StockAdjustmentStatusPill";
import {
  STOCK_ADJUSTMENT_ACTION_REASON_OPTIONS,
  STOCK_ADJUSTMENT_INVOICE_STATUS_OPTIONS,
  type StockAdjustmentInvoiceStatusFilter,
} from "@/features/invoices/filters/stockAdjustmentInvoiceFilters";
import { useStockAdjustmentInvoices } from "@/features/invoices/hooks/useStockAdjustmentInvoices";
import type { StockAdjustmentActionReason } from "@/features/invoices/services/stockAdjustmentInvoice.service";
import { stockAdjustmentInvoiceColumns } from "@/features/invoices/table/stockAdjustmentInvoiceColumns";
import { useDict } from "@/lib/lang/DictProvider";
import { getFilterPillClassName } from "@/lib/ui/filterPillClassName";
import { Filter, Hash, Package, Plus, RotateCcw, User as UserIcon } from "lucide-react";
import AddStockAdjustmentInvoicePopup from "@/features/invoices/layout/AddStockAdjustmentInvoicePopup";
import { useRouter } from "next/navigation";

type StockAdjustmentSortBy =
  | "invoiceId"
  | "totalQuantity"
  | "createdAt"
  | "confirmedAt";
type SortOrder = "asc" | "desc";

function getStatusFilterClass(
  optionValue: StockAdjustmentInvoiceStatusFilter,
  statusFilter: StockAdjustmentInvoiceStatusFilter,
): string {
  return getFilterPillClassName(
    optionValue,
    statusFilter,
    "all",
    (value) =>
      value === "all"
        ? "neutral"
        : STATUS_ACCENT[value as "draft" | "confirmed"] ?? "neutral",
  );
}

export default function StockAdjustmentInvoicesListPage() {
  const router = useRouter();
  const dict = useDict();

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(30);

  const columns = useMemo(
    () =>
      stockAdjustmentInvoiceColumns(dict, {
        page,
        rowsPerPage,
      }),
    [dict, page, rowsPerPage],
  );

  const [search, setSearch] = useState<string>("");
  const [searchRule, setSearchRule] = useState<
    "invoiceId" | "userId" | "productId"
  >("invoiceId");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] =
    useState<StockAdjustmentInvoiceStatusFilter>("all");
  const [actionReasonFilter, setActionReasonFilter] = useState<
    StockAdjustmentActionReason | "all"
  >("all");
  const [addInvoicePopupOpen, setAddInvoicePopupOpen] = useState<boolean>(false);
  const [ruleInputResetKey, setRuleInputResetKey] = useState<number>(0);
  const [sortBy, setSortBy] = useState<StockAdjustmentSortBy | undefined>(
    undefined,
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const { rows, total, loading, refetch } = useStockAdjustmentInvoices({
    page,
    limit: rowsPerPage,
    search: search || undefined,
    searchBy: search ? searchRule : undefined,
    sortBy,
    sortOrder: sortBy ? sortOrder : undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    actionReason:
      actionReasonFilter === "all" ? undefined : actionReasonFilter,
  });

  function handleSort(nextField: string): void {
    if (
      nextField !== "invoiceId" &&
      nextField !== "totalQuantity" &&
      nextField !== "createdAt" &&
      nextField !== "confirmedAt"
    ) {
      return;
    }

    if (sortBy !== nextField) {
      setSortBy(nextField as StockAdjustmentSortBy);
      setSortOrder("asc");
      setPage(1);
      return;
    }

    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setPage(1);
  }

  const totalPages = total === 0 ? 1 : Math.ceil(total / rowsPerPage);
  const isResetFilterDisabled =
    search.length === 0 &&
    searchRule === "invoiceId" &&
    statusFilter === "all" &&
    actionReasonFilter === "all" &&
    sortBy === undefined &&
    page === 1 &&
    showFilters === false;

  function handleResetFilters(): void {
    setSearch("");
    setSearchRule("invoiceId");
    setStatusFilter("all");
    setActionReasonFilter("all");
    setSortBy(undefined);
    setSortOrder("asc");
    setPage(1);
    setShowFilters(false);
    setRuleInputResetKey((value) => value + 1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4">
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex items-center justify-start gap-2">
          <h1 className="text-xl font-semibold">
            {dict.stockAdjustmentInvoices}
          </h1>
        </div>

        <div className="w-full max-w-xl">
          <RuleInput
            key={ruleInputResetKey}
            options={[
              {
                label: dict.invoiceNumber,
                icon: <Hash className="h-3 w-3" />,
              },
              {
                label: dict.confirmBy,
                icon: <UserIcon className="h-3 w-3" />,
              },
              {
                label: dict.productIdSearchLabel,
                icon: <Package className="h-3 w-3" />,
              },
            ]}
            placeholder={dict.searchPlaceholder}
            onChange={({ rule, value }) => {
              if (rule === dict.confirmBy) {
                setSearchRule("userId");
              } else if (rule === dict.productIdSearchLabel) {
                setSearchRule("productId");
              } else {
                setSearchRule("invoiceId");
              }
              setSearch(value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            icon={<Filter className="h-3.5 w-3.5" />}
            accent={showFilters ? "primary" : "neutral"}
            size="sm"
            onClick={() => setShowFilters((value) => !value)}
          >
            <span>{dict.filter}</span>
          </Button>

          <Button
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            accent="neutral"
            size="sm"
            onClick={handleResetFilters}
            disabled={isResetFilterDisabled}
          >
            {dict.resetFilter}
          </Button>

          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            accent="primary"
            size="sm"
            onClick={() => setAddInvoicePopupOpen(true)}
          >
            {dict.createNewStockAdjustmentDraft}
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {dict.status}
            </span>

            <div className="flex gap-1">
              {STOCK_ADJUSTMENT_INVOICE_STATUS_OPTIONS.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    setStatusFilter(option.value);
                    setPage(1);
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-opacity ${getStatusFilterClass(option.value, statusFilter)}`}
                >
                  {dict[option.dictKey]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">
              {dict.actionReasonLabel}
            </span>
            <div className="flex flex-wrap gap-1">
              {STOCK_ADJUSTMENT_ACTION_REASON_OPTIONS.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    setActionReasonFilter(option.value);
                    setPage(1);
                  }}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-opacity ${getFilterPillClassName(
                    option.value,
                    actionReasonFilter,
                    "all",
                    () => "neutral",
                  )}`}
                >
                  {option.value === "all"
                    ? dict.all
                    : (dict as Record<string, string>)[option.dictKey] ??
                      option.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        getRowId={(row) => row.id}
        sortField={sortBy}
        sortDirection={sortOrder}
        onSort={handleSort}
        maxHeight="fill"
      />

      <TablePagination
        page={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
        setPage={setPage}
        totalResults={total}
        dict={dict}
      />

      <AddStockAdjustmentInvoicePopup
        open={addInvoicePopupOpen}
        onClose={() => setAddInvoicePopupOpen(false)}
        onCreated={(invoiceId) => {
          void refetch();
          router.push(`/manager/invoices/stock-adjustment/${invoiceId}`);
        }}
      />
    </div>
  );
}
