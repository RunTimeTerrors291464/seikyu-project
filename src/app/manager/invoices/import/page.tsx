"use client";

import { useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/Buttons";
import RuleInput from "@/components/ui/RuleInput";
import InvoiceListExpandedReturnsPanel from "@/features/invoices/components/InvoiceListExpandedReturnsPanel";
import InvoiceListFilterPillGroup from "@/features/invoices/components/InvoiceListFilterPillGroup";
import InvoiceListPageShell from "@/features/invoices/components/InvoiceListPageShell";
import { STATUS_ACCENT } from "@/features/invoices/components/ImportInvoiceStatusPill";
import {
  IMPORT_INVOICE_STATUS_OPTIONS,
  ImportInvoiceStatusFilter,
} from "@/features/invoices/filters/importInvoiceFilters";
import {
  ImportInvoiceRow,
  useImportInvoices,
} from "@/features/invoices/hooks/useImportInvoices";
import {
  useInvoiceListPageBase,
  useInvoiceListSort,
  useReturnChildSort,
} from "@/features/invoices/hooks/useInvoiceListPageBase";
import { useInvoiceReturnChildrenExpansion } from "@/features/invoices/hooks/useInvoiceReturnChildrenExpansion";
import AddImportInvoicePopup from "@/features/invoices/layout/AddImportInvoicePopup";
import type {
  ImportInvoiceListSortBy,
  ImportInvoiceStatus,
} from "@/features/invoices/services/importInvoice.service";
import type { ReturnImportInvoiceWithoutProductsDto } from "@/features/invoices/services/returnImportInvoice.service";
import { getReturnImportInvoiceList } from "@/features/invoices/services/returnImportInvoice.service";
import { importInvoiceColumns } from "@/features/invoices/table/importInvoiceColumns";
import { returnImportInvoiceListColumns } from "@/features/invoices/table/returnImportInvoiceListColumns";
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
import { Hash, Plus, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const RETURN_CHILDREN_LIMIT = 100;
const DEFAULT_SORT_BY: ImportInvoiceListSortBy = "createdAt";
const DEFAULT_SEARCH_RULE = "invoiceId" as const;

function getStatusFilterClass(
  optionValue: ImportInvoiceStatusFilter,
  statusFilter: ImportInvoiceStatusFilter,
): string {
  return getFilterPillClassName(
    optionValue,
    statusFilter,
    "all",
    (value) => STATUS_ACCENT[value as ImportInvoiceStatus] ?? "neutral",
  );
}

export default function ImportInvoicesListPage() {
  const router = useRouter();
  const dict = useDict();
  const canManage = useMayUseManagerWorkflowControls();
  const listBase = useInvoiceListPageBase();
  const [searchRule, setSearchRule] = useState<"invoiceId" | "userId">(
    DEFAULT_SEARCH_RULE,
  );
  const [statusFilter, setStatusFilter] =
    useState<ImportInvoiceStatusFilter>("all");
  const [addInvoicePopupOpen, setAddInvoicePopupOpen] = useState<boolean>(false);
  const { sortBy, sortOrder, handleSort, resetSort, isDefaultSort } =
    useInvoiceListSort(
      DEFAULT_SORT_BY,
      "desc",
      [
        "invoiceId",
        "totalImportPrice",
        "createdAt",
        "confirmedAt",
        "draftAt",
      ],
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
      importInvoiceColumns(dict, {
        page: listBase.page,
        rowsPerPage: listBase.rowsPerPage,
      }),
    [dict, listBase.page, listBase.rowsPerPage],
  );
  const returnColumns = useMemo(
    () =>
      returnImportInvoiceListColumns(
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
      return IMPORT_INVOICE_STATUS_OPTIONS.map(function mapOption(option) {
        return { value: option.value, label: dict[option.dictKey] };
      });
    },
    [dict],
  );

  const { rows, total, loading, refetch } = useImportInvoices({
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

  const fetchReturnChildren = useCallback(async function fetchReturnChildren(
    invoiceNumber: string,
  ): Promise<ReturnImportInvoiceWithoutProductsDto[]> {
    const response = await getReturnImportInvoiceList({
      search: invoiceNumber,
      searchBy: "importInvoiceId",
      limit: RETURN_CHILDREN_LIMIT,
      page: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    return response.invoices;
  }, []);

  const returnExpansion = useInvoiceReturnChildrenExpansion<ImportInvoiceRow>({
    rows,
    getRowId: (row) => row.id,
    getReturnCount: (row) => row.returnCount,
    getInvoiceNumber: (row) => row.invoiceId,
    fetchChildren: fetchReturnChildren,
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
    isDefaultReturnSort &&
    listBase.page === 1 &&
    listBase.showFilters === false &&
    !returnExpansion.hasExpandedRows;

  function handleResetFilters(): void {
    listBase.setSearch("");
    setSearchRule(DEFAULT_SEARCH_RULE);
    setStatusFilter("all");
    listBase.resetDateRange();
    resetSort();
    resetReturnSort();
    listBase.resetPagination();
    listBase.setShowFilters(false);
    returnExpansion.resetExpansion();
    listBase.resetRuleInput();
  }

  return (
    <InvoiceListPageShell<ImportInvoiceRow>
      title={dict.importInvoices}
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
          ]}
          placeholder={dict.searchPlaceholder}
          onChange={function handleSearchChange({ rule, value }): void {
            setSearchRule(rule === dict.confirmBy ? "userId" : DEFAULT_SEARCH_RULE);
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
            {dict.createNewImportDraft}
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
      tableProps={{
        expansionAfterColumnCount: 1,
        expandedRowIds: returnExpansion.expandedRowIds,
        onToggleExpandRow: returnExpansion.handleToggleExpandRow,
        canExpandRow: (row) => row.returnCount > 0,
        renderExpandedRow: function renderExpandedRow(row) {
          const importId = row.id;
          const childLoading = returnExpansion.childrenLoading[importId] === true;
          const children =
            (returnExpansion.childrenByParentId[
              importId
            ] as ReturnImportInvoiceWithoutProductsDto[] | undefined) ?? [];

          return (
            <InvoiceListExpandedReturnsPanel<ReturnImportInvoiceWithoutProductsDto>
              loading={childLoading}
              returnRows={children}
              columns={returnColumns}
              sortField={returnSortBy}
              sortDirection={returnSortOrder}
              onSort={handleReturnSort}
              sortAccessors={{
                getReturnInvoiceId: (child) => child.returnInvoiceId,
                getUserName: (child) => child.confirmedByUsername,
                getCreatedAt: (child) => child.draftAt,
              }}
              getRowId={(child) => child.id}
            />
          );
        },
      }}
      footer={
        canManage ? (
          <AddImportInvoicePopup
            open={addInvoicePopupOpen}
            onClose={function closeCreatePopup(): void {
              setAddInvoicePopupOpen(false);
            }}
            onCreated={function navigateToCreatedInvoice(invoiceId): void {
              void refetch();
              router.push(`/manager/invoices/import/${invoiceId}`);
            }}
          />
        ) : null
      }
    />
  );
}
