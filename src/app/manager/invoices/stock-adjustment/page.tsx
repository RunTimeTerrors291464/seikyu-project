"use client";

import { useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/Buttons";
import RuleInput from "@/components/ui/RuleInput";
import InvoiceListFilterPillGroup from "@/features/invoices/components/InvoiceListFilterPillGroup";
import InvoiceListPageShell from "@/features/invoices/components/InvoiceListPageShell";
import { STATUS_ACCENT } from "@/features/invoices/components/StockAdjustmentStatusPill";
import {
  STOCK_ADJUSTMENT_INVOICE_STATUS_OPTIONS,
  type StockAdjustmentInvoiceStatusFilter,
} from "@/features/invoices/filters/stockAdjustmentInvoiceFilters";
import {
  useInvoiceListPageBase,
  useInvoiceListSort,
} from "@/features/invoices/hooks/useInvoiceListPageBase";
import { useStockAdjustmentInvoices } from "@/features/invoices/hooks/useStockAdjustmentInvoices";
import AddStockAdjustmentInvoicePopup from "@/features/invoices/layout/AddStockAdjustmentInvoicePopup";
import { stockAdjustmentInvoiceColumns } from "@/features/invoices/table/stockAdjustmentInvoiceColumns";
import { useMayUseManagerWorkflowControls } from "@/lib/hooks/useManagerWorkflowAccess";
import { useDict } from "@/lib/lang/DictProvider";
import {
  UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
  UNIVERSAL_NEW_SHORTCUT_CHORD,
  UNIVERSAL_NEW_SHORTCUT_FALLBACK_LABEL,
  UNIVERSAL_NEW_SHORTCUT_ID,
} from "@/lib/shortcuts/universalShortcut";
import useShortcut from "@/lib/shortcuts/useShortcut";
import { getFilterPillClassName } from "@/lib/ui/filterPillClassName";
import { Hash, Package, Plus, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type StockAdjustmentSortBy =
  | "invoiceId"
  | "totalQuantity"
  | "createdAt"
  | "confirmedAt";

const DEFAULT_SORT_BY: StockAdjustmentSortBy = "createdAt";
const DEFAULT_SEARCH_RULE = "invoiceId" as const;

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
  const canManage = useMayUseManagerWorkflowControls();
  const listBase = useInvoiceListPageBase();
  const [searchRule, setSearchRule] = useState<
    "invoiceId" | "userId" | "productId"
  >(DEFAULT_SEARCH_RULE);
  const [statusFilter, setStatusFilter] =
    useState<StockAdjustmentInvoiceStatusFilter>("all");
  const [addInvoicePopupOpen, setAddInvoicePopupOpen] = useState<boolean>(false);
  const { sortBy, sortOrder, handleSort, resetSort, isDefaultSort } =
    useInvoiceListSort(
      DEFAULT_SORT_BY,
      "desc",
      ["invoiceId", "totalQuantity", "createdAt", "confirmedAt"],
      listBase.resetPageOnFilterChange,
    );

  const columns = useMemo(
    () =>
      stockAdjustmentInvoiceColumns(dict, {
        page: listBase.page,
        rowsPerPage: listBase.rowsPerPage,
      }),
    [dict, listBase.page, listBase.rowsPerPage],
  );

  const statusOptions = useMemo(
    function buildStatusOptions() {
      return STOCK_ADJUSTMENT_INVOICE_STATUS_OPTIONS.map(function mapOption(
        option,
      ) {
        return { value: option.value, label: dict[option.dictKey] };
      });
    },
    [dict],
  );

  const { rows, total, loading, refetch } = useStockAdjustmentInvoices({
    page: listBase.page,
    limit: listBase.rowsPerPage,
    search: listBase.search || undefined,
    searchBy: listBase.search ? searchRule : undefined,
    sortBy,
    sortOrder,
    status: statusFilter === "all" ? undefined : statusFilter,
    fromDate: listBase.listDateRange.fromDate,
    toDate: listBase.listDateRange.toDate,
  });

  const handleUniversalNewShortcut = useCallback(function handleUniversalNewShortcut(
    _event: KeyboardEvent,
  ): void {
    void _event;
    setAddInvoicePopupOpen(true);
  }, []);

  useShortcut({
    id: UNIVERSAL_NEW_SHORTCUT_ID,
    chord: UNIVERSAL_NEW_SHORTCUT_CHORD,
    label: UNIVERSAL_NEW_SHORTCUT_FALLBACK_LABEL,
    handler: handleUniversalNewShortcut,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    enabled: canManage && !addInvoicePopupOpen,
  });

  const totalPages = total === 0 ? 1 : Math.ceil(total / listBase.rowsPerPage);
  const isResetFilterDisabled =
    listBase.search.length === 0 &&
    searchRule === DEFAULT_SEARCH_RULE &&
    statusFilter === "all" &&
    listBase.isDefaultRange &&
    isDefaultSort &&
    listBase.page === 1 &&
    listBase.showFilters === false;

  function handleResetFilters(): void {
    listBase.setSearch("");
    setSearchRule(DEFAULT_SEARCH_RULE);
    setStatusFilter("all");
    listBase.resetDateRange();
    resetSort();
    listBase.resetPagination();
    listBase.setShowFilters(false);
    listBase.resetRuleInput();
  }

  return (
    <InvoiceListPageShell
      title={dict.stockAdjustmentInvoices}
      searchInput={
        <RuleInput
          key={listBase.ruleInputResetKey}
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
              label: dict.productSkuSearchLabel,
              icon: <Package className="h-3 w-3" />,
            },
          ]}
          placeholder={dict.searchPlaceholder}
          onChange={function handleSearchChange({ rule, value }): void {
            if (rule === dict.confirmBy) {
              setSearchRule("userId");
            } else if (rule === dict.productSkuSearchLabel) {
              setSearchRule("productId");
            } else {
              setSearchRule(DEFAULT_SEARCH_RULE);
            }
            listBase.setSearch(value);
            listBase.resetPageOnFilterChange();
          }}
        />
      }
      showFilters={listBase.showFilters}
      onToggleFilters={function toggleFilters(): void {
        listBase.setShowFilters(function toggle(value) {
          return !value;
        });
      }}
      onResetFilters={handleResetFilters}
      isResetFilterDisabled={isResetFilterDisabled}
      toolbarActions={
        canManage ? (
          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            accent="primary"
            size="sm"
            onClick={function openCreatePopup(): void {
              setAddInvoicePopupOpen(true);
            }}
          >
            {dict.createNewStockAdjustmentDraft}
          </Button>
        ) : null
      }
      filterGroups={
        <InvoiceListFilterPillGroup
          label={dict.status}
          options={statusOptions}
          value={statusFilter}
          onChange={function selectStatus(value): void {
            setStatusFilter(value);
            listBase.resetPageOnFilterChange();
          }}
          getOptionClassName={getStatusFilterClass}
        />
      }
      filterGroupsLayout="stack"
      fromDate={listBase.fromDate}
      toDate={listBase.toDate}
      onFromDateChange={function handleFromDateChange(value): void {
        listBase.setFromDate(value);
        listBase.resetPageOnFilterChange();
      }}
      onToDateChange={function handleToDateChange(value): void {
        listBase.setToDate(value);
        listBase.resetPageOnFilterChange();
      }}
      columns={columns}
      rows={rows}
      loading={loading}
      getRowId={(row) => row.id}
      sortField={sortBy}
      sortDirection={sortOrder}
      onSort={handleSort}
      page={listBase.page}
      totalPages={totalPages}
      rowsPerPage={listBase.rowsPerPage}
      onRowsPerPageChange={listBase.handleRowsPerPageChange}
      onPageChange={listBase.setPage}
      totalResults={total}
      footer={
        canManage ? (
          <AddStockAdjustmentInvoicePopup
            open={addInvoicePopupOpen}
            onClose={function closeCreatePopup(): void {
              setAddInvoicePopupOpen(false);
            }}
            onCreated={function navigateToCreatedInvoice(invoiceId): void {
              void refetch();
              router.push(`/manager/invoices/stock-adjustment/${invoiceId}`);
            }}
          />
        ) : null
      }
    />
  );
}
