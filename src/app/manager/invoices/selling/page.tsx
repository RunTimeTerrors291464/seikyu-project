"use client";

import { useCallback, useMemo, useState } from "react";

import RuleInput from "@/components/ui/RuleInput";
import InvoiceListExpandedReturnsPanel from "@/features/invoices/components/InvoiceListExpandedReturnsPanel";
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
  useReturnChildSort,
} from "@/features/invoices/hooks/useInvoiceListPageBase";
import { useInvoiceReturnChildrenExpansion } from "@/features/invoices/hooks/useInvoiceReturnChildrenExpansion";
import {
  SellingInvoiceRow,
  useSellingInvoices,
} from "@/features/invoices/hooks/useSellingInvoices";
import type { ReturnSellingInvoiceWithoutProductsDto } from "@/features/invoices/services/returnSellingInvoice.service";
import { getReturnSellingInvoiceList } from "@/features/invoices/services/returnSellingInvoice.service";
import type { SellingInvoiceStatus } from "@/features/invoices/services/sellingInvoice.service";
import { returnSellingInvoiceListColumns } from "@/features/invoices/table/returnSellingInvoiceListColumns";
import { sellingInvoiceColumns } from "@/features/invoices/table/sellingInvoiceColumns";
import { useDict } from "@/lib/lang/DictProvider";
import { getFilterPillClassName } from "@/lib/ui/filterPillClassName";
import { Hash, Package, User as UserIcon } from "lucide-react";

const RETURN_CHILDREN_LIMIT = 100;
const DEFAULT_SORT_BY = "confirmedAt" as const;
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

export default function ManagerSellingInvoicesPage() {
  const dict = useDict();
  const listBase = useInvoiceListPageBase();
  const [searchRule, setSearchRule] = useState<
    "invoiceId" | "userId" | "productId"
  >(DEFAULT_SEARCH_RULE);
  const [statusFilter, setStatusFilter] =
    useState<SellingInvoiceStatusFilter>("all");
  const [taxFocusFilter, setTaxFocusFilter] =
    useState<SellingInvoiceTaxFocusFilter>("all");
  const { sortBy, sortOrder, handleSort, resetSort, isDefaultSort } =
    useInvoiceListSort(
      DEFAULT_SORT_BY,
      "desc",
      ["invoiceId", "totalSellingPrice", "confirmedAt"],
      listBase.resetPageOnFilterChange,
    );
  const {
    returnSortBy,
    returnSortOrder,
    handleReturnSort,
    resetReturnSort,
    isDefaultReturnSort,
  } = useReturnChildSort("createdAt", "desc");

  const columns = useMemo(
    () =>
      sellingInvoiceColumns(dict, {
        detailBasePath: "/manager/invoices/selling",
        pagination: { page: listBase.page, rowsPerPage: listBase.rowsPerPage },
      }),
    [dict, listBase.page, listBase.rowsPerPage],
  );
  const returnColumns = useMemo(
    () =>
      returnSellingInvoiceListColumns(
        dict,
        {
          page: 1,
          rowsPerPage: RETURN_CHILDREN_LIMIT,
        },
        false,
      ),
    [dict],
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

  const { rows, total, loading } = useSellingInvoices({
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

  const fetchReturnChildren = useCallback(async function fetchReturnChildren(
    invoiceNumber: string,
  ): Promise<ReturnSellingInvoiceWithoutProductsDto[]> {
    const response = await getReturnSellingInvoiceList({
      search: invoiceNumber,
      searchBy: "sellingInvoiceId",
      limit: RETURN_CHILDREN_LIMIT,
      page: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    return response.invoices;
  }, []);

  const returnExpansion = useInvoiceReturnChildrenExpansion<SellingInvoiceRow>({
    rows,
    getRowId: (row) => row.id,
    getReturnCount: (row) => row.returnCount,
    getInvoiceNumber: (row) => row.invoiceId,
    fetchChildren: fetchReturnChildren,
  });

  const totalPages = total === 0 ? 1 : Math.ceil(total / listBase.rowsPerPage);
  const isResetFilterDisabled =
    listBase.search.length === 0 &&
    searchRule === DEFAULT_SEARCH_RULE &&
    statusFilter === "all" &&
    taxFocusFilter === "all" &&
    listBase.isDefaultRange &&
    isDefaultSort &&
    isDefaultReturnSort &&
    listBase.page === 1 &&
    listBase.showFilters === false &&
    !returnExpansion.hasExpandedRows;

  function handleResetFilters(): void {
    listBase.setSearch("");
    setSearchRule(DEFAULT_SEARCH_RULE);
    setStatusFilter("all");
    setTaxFocusFilter("all");
    listBase.resetDateRange();
    resetSort();
    resetReturnSort();
    listBase.resetPagination();
    listBase.setShowFilters(false);
    returnExpansion.resetExpansion();
    listBase.resetRuleInput();
  }

  return (
    <InvoiceListPageShell<SellingInvoiceRow>
      title={dict.sellingInvoicesManager}
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
      tableProps={{
        expansionAfterColumnCount: 1,
        expandedRowIds: returnExpansion.expandedRowIds,
        onToggleExpandRow: returnExpansion.handleToggleExpandRow,
        canExpandRow: (row) => row.returnCount > 0,
        renderExpandedRow: function renderExpandedRow(row) {
          const sellingId = row.id;
          const childLoading = returnExpansion.childrenLoading[sellingId] === true;
          const children =
            (returnExpansion.childrenByParentId[
              sellingId
            ] as ReturnSellingInvoiceWithoutProductsDto[] | undefined) ?? [];

          return (
            <InvoiceListExpandedReturnsPanel<ReturnSellingInvoiceWithoutProductsDto>
              loading={childLoading}
              returnRows={children}
              columns={returnColumns}
              sortField={returnSortBy}
              sortDirection={returnSortOrder}
              onSort={handleReturnSort}
              sortAccessors={{
                getReturnInvoiceId: (child) => child.returnInvoiceId,
                getUserName: (child) => child.confirmedByUsername,
                getCreatedAt: (child) => child.createdAt,
              }}
              getRowId={(child) => child.id}
            />
          );
        },
      }}
    />
  );
}
