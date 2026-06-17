"use client";

import { useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/Buttons";
import RuleInput from "@/components/ui/RuleInput";
import InvoiceListFilterPillGroup from "@/features/invoices/components/InvoiceListFilterPillGroup";
import InvoiceListPageShell from "@/features/invoices/components/InvoiceListPageShell";
import { SELLING_STATUS_ACCENT } from "@/features/invoices/components/SellingInvoiceStatusPill";
import {
  SELLING_INVOICE_STATUS_OPTIONS,
  SELLING_INVOICE_TAX_FOCUS_OPTIONS,
  SellingInvoiceStatusFilter,
  SellingInvoiceTaxFocusFilter,
} from "@/features/invoices/filters/sellingInvoiceFilters";
import {
  useInvoiceListPageBase,
  useInvoiceListSort,
} from "@/features/invoices/hooks/useInvoiceListPageBase";
import {
  SellingInvoiceRow,
  useSellingInvoices,
} from "@/features/invoices/hooks/useSellingInvoices";
import AddSellingInvoicePopup from "@/features/invoices/layout/AddSellingInvoicePopup";
import { sellingInvoiceColumns } from "@/features/invoices/table/sellingInvoiceColumns";
import { useMayCreateSellingInvoice } from "@/lib/hooks/useManagerWorkflowAccess";
import { useDict } from "@/lib/lang/DictProvider";
import {
  UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
  UNIVERSAL_NEW_SHORTCUT_CHORD,
  UNIVERSAL_NEW_SHORTCUT_FALLBACK_LABEL,
  UNIVERSAL_NEW_SHORTCUT_ID,
} from "@/lib/shortcuts/universalShortcut";
import useShortcut from "@/lib/shortcuts/useShortcut";
import { getFilterPillClassName } from "@/lib/ui/filterPillClassName";
import { Hash, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import type { SellingInvoiceStatus } from "@/features/invoices/services/sellingInvoice.service";

type SellingInvoiceSortBy = "invoiceId" | "totalSellingPrice" | "confirmedAt";

const DEFAULT_SORT_BY: SellingInvoiceSortBy = "confirmedAt";
const DEFAULT_SEARCH_RULE = "invoiceId" as const;

function getStatusFilterClass(
  optionValue: SellingInvoiceStatusFilter,
  statusFilter: SellingInvoiceStatusFilter,
): string {
  return getFilterPillClassName(
    optionValue,
    statusFilter,
    "all",
    (value) => SELLING_STATUS_ACCENT[value as SellingInvoiceStatus] ?? "neutral",
  );
}

function getTaxFocusFilterClass(
  optionValue: SellingInvoiceTaxFocusFilter,
  taxFocusFilter: SellingInvoiceTaxFocusFilter,
): string {
  return getFilterPillClassName(
    optionValue,
    taxFocusFilter,
    "all",
    (value) => (value === "true" ? "success" : "danger"),
  );
}

export default function CashierSellingInvoicesPage() {
  const router = useRouter();
  const dict = useDict();
  const canCreateSelling = useMayCreateSellingInvoice();
  const listBase = useInvoiceListPageBase();
  const [searchRule, setSearchRule] = useState<"invoiceId">(DEFAULT_SEARCH_RULE);
  const [statusFilter, setStatusFilter] =
    useState<SellingInvoiceStatusFilter>("all");
  const [taxFocusFilter, setTaxFocusFilter] =
    useState<SellingInvoiceTaxFocusFilter>("all");
  const [addInvoicePopupOpen, setAddInvoicePopupOpen] = useState<boolean>(false);
  const { sortBy, sortOrder, handleSort, resetSort, isDefaultSort } =
    useInvoiceListSort(
      DEFAULT_SORT_BY,
      "desc",
      ["invoiceId", "totalSellingPrice", "confirmedAt"],
      listBase.resetPageOnFilterChange,
    );

  const columns = useMemo(
    () =>
      sellingInvoiceColumns(dict, {
        detailBasePath: "/cashier/selling",
        pagination: { page: listBase.page, rowsPerPage: listBase.rowsPerPage },
      }),
    [dict, listBase.page, listBase.rowsPerPage],
  );

  const statusOptions = useMemo(
    function buildStatusOptions() {
      return SELLING_INVOICE_STATUS_OPTIONS.map(function mapOption(option) {
        return { value: option.value, label: dict[option.dictKey] };
      });
    },
    [dict],
  );

  const taxFocusOptions = useMemo(
    function buildTaxFocusOptions() {
      return SELLING_INVOICE_TAX_FOCUS_OPTIONS.map(function mapOption(option) {
        return { value: option.value, label: dict[option.dictKey] };
      });
    },
    [dict],
  );

  const { rows, total, loading, refetch } = useSellingInvoices({
    page: listBase.page,
    limit: listBase.rowsPerPage,
    search: listBase.search || undefined,
    searchBy: listBase.search ? searchRule : undefined,
    sortBy,
    sortOrder,
    status: statusFilter === "all" ? undefined : statusFilter,
    taxFocus: taxFocusFilter === "all" ? undefined : taxFocusFilter,
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
    enabled: canCreateSelling && !addInvoicePopupOpen,
  });

  const totalPages = total === 0 ? 1 : Math.ceil(total / listBase.rowsPerPage);
  const isResetFilterDisabled =
    listBase.search.length === 0 &&
    searchRule === DEFAULT_SEARCH_RULE &&
    statusFilter === "all" &&
    taxFocusFilter === "all" &&
    listBase.isDefaultRange &&
    isDefaultSort &&
    listBase.page === 1 &&
    listBase.showFilters === false;

  function handleResetFilters(): void {
    listBase.setSearch("");
    setSearchRule(DEFAULT_SEARCH_RULE);
    setStatusFilter("all");
    setTaxFocusFilter("all");
    listBase.resetDateRange();
    resetSort();
    listBase.resetPagination();
    listBase.setShowFilters(false);
    listBase.resetRuleInput();
  }

  return (
    <InvoiceListPageShell<SellingInvoiceRow>
      title={dict.salesInvoices}
      searchInput={
        <RuleInput
          key={listBase.ruleInputResetKey}
          options={[
            {
              label: dict.invoiceNumber,
              icon: <Hash className="h-3 w-3" />,
            },
          ]}
          placeholder={dict.searchPlaceholder}
          onChange={function handleSearchChange({ value }): void {
            setSearchRule(DEFAULT_SEARCH_RULE);
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
        canCreateSelling ? (
          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            accent="primary"
            size="sm"
            onClick={function openCreatePopup(): void {
              setAddInvoicePopupOpen(true);
            }}
          >
            {dict.createNewSellingInvoice}
          </Button>
        ) : null
      }
      filterGroups={
        <>
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
          <InvoiceListFilterPillGroup
            label={dict.taxFocusLabel}
            options={taxFocusOptions}
            value={taxFocusFilter}
            onChange={function selectTaxFocus(value): void {
              setTaxFocusFilter(value);
              listBase.resetPageOnFilterChange();
            }}
            getOptionClassName={getTaxFocusFilterClass}
          />
        </>
      }
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
        canCreateSelling ? (
          <AddSellingInvoicePopup
            open={addInvoicePopupOpen}
            onClose={function closeCreatePopup(): void {
              setAddInvoicePopupOpen(false);
            }}
            onCreated={function navigateToCreatedInvoice(invoiceId): void {
              void refetch();
              router.push(`/cashier/selling/${invoiceId}`);
            }}
          />
        ) : null
      }
    />
  );
}
