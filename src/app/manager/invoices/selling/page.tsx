"use client";

import { useCallback, useMemo, useState } from "react";

import Button from "@/components/ui/Buttons";
import RuleInput from "@/components/ui/RuleInput";
import BulkDeleteInvoicesPopup from "@/features/invoices/components/BulkDeleteInvoicesPopup";
import InvoiceListExpandedReturnsPanel from "@/features/invoices/components/InvoiceListExpandedReturnsPanel";
import ListFilterSelectGroup from "@/components/ui/ListFilterSelectGroup";
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
import { useInvoiceListSelection } from "@/features/invoices/hooks/useInvoiceListSelection";
import AddSellingInvoicePopup from "@/features/invoices/layout/AddSellingInvoicePopup";
import type { ReturnSellingInvoiceWithoutProductsDto } from "@/features/invoices/services/returnSellingInvoice.service";
import {
  deleteReturnSellingDrafts,
  getReturnSellingInvoiceList,
} from "@/features/invoices/services/returnSellingInvoice.service";
import type { SellingInvoiceStatus } from "@/features/invoices/services/sellingInvoice.service";
import { deleteSellingInvoices } from "@/features/invoices/services/sellingInvoice.service";
import { invoiceListSelectionColumn } from "@/features/invoices/table/invoiceListSelectionColumn";
import { returnSellingInvoiceListColumns } from "@/features/invoices/table/returnSellingInvoiceListColumns";
import { sellingInvoiceColumns } from "@/features/invoices/table/sellingInvoiceColumns";
import type { Accent } from "@/components/types/ui";
import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useMayUseManagerWorkflowControls } from "@/lib/hooks/useManagerWorkflowAccess";
import { useDict } from "@/lib/lang/DictProvider";
import {
  UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
  UNIVERSAL_NEW_SHORTCUT_CHORD,
  UNIVERSAL_NEW_SHORTCUT_FALLBACK_LABEL,
  UNIVERSAL_NEW_SHORTCUT_ID,
} from "@/lib/shortcuts/universalShortcut";
import useShortcut from "@/lib/shortcuts/useShortcut";
import { Hash, Package, Plus, Trash2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const RETURN_CHILDREN_LIMIT = 100;
const DEFAULT_SORT_BY = "confirmedAt" as const;
const DEFAULT_SEARCH_RULE = "invoiceId" as const;

export default function ManagerSellingInvoicesPage() {
  const router = useRouter();
  const dict = useDict();
  const canManage = useMayUseManagerWorkflowControls();
  const listBase = useInvoiceListPageBase();
  const [searchRule, setSearchRule] = useState<
    "invoiceId" | "userId" | "productId"
  >(DEFAULT_SEARCH_RULE);
  const [statusFilter, setStatusFilter] =
    useState<SellingInvoiceStatusFilter>("all");
  const [taxFocusFilter, setTaxFocusFilter] =
    useState<SellingInvoiceTaxFocusFilter>("all");
  const [addInvoicePopupOpen, setAddInvoicePopupOpen] = useState<boolean>(false);
  const [deletePopupOpen, setDeletePopupOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const sellingSelection = useInvoiceListSelection();
  const returnSelection = useInvoiceListSelection();
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

  const returnColumns = useMemo(
    function buildReturnColumns() {
      const baseColumns = returnSellingInvoiceListColumns(
        dict,
        {
          page: 1,
          rowsPerPage: RETURN_CHILDREN_LIMIT,
        },
        false,
      );

      if (!canManage) {
        return baseColumns;
      }

      return [
        invoiceListSelectionColumn<ReturnSellingInvoiceWithoutProductsDto>({
          dict,
          rows: [],
          selectedIds: returnSelection.selectedIds,
          getRowId: (row) => row.id,
          onToggleOne: returnSelection.toggleOne,
          onToggleMany: returnSelection.toggleMany,
          isRowSelectable: (row) => row.status === "draft",
          getDisabledReason: () => dict.onlyDraftReturnInvoicesCanBeDeleted,
          showSelectAll: false,
        }),
        ...baseColumns,
      ];
    },
    [
      canManage,
      dict,
      returnSelection.selectedIds,
      returnSelection.toggleMany,
      returnSelection.toggleOne,
    ],
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

  const { rows, total, loading, error, refetch } = useSellingInvoices({
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

  const columns = useMemo(
    function buildColumns() {
      const baseColumns = sellingInvoiceColumns(dict, {
        detailBasePath: "/manager/invoices/selling",
        pagination: { page: listBase.page, rowsPerPage: listBase.rowsPerPage },
      });

      if (!canManage) {
        return baseColumns;
      }

      return [
        invoiceListSelectionColumn<SellingInvoiceRow>({
          dict,
          rows,
          selectedIds: sellingSelection.selectedIds,
          getRowId: (row) => row.id,
          onToggleOne: sellingSelection.toggleOne,
          onToggleMany: sellingSelection.toggleMany,
        }),
        ...baseColumns,
      ];
    },
    [
      canManage,
      dict,
      listBase.page,
      listBase.rowsPerPage,
      rows,
      sellingSelection.selectedIds,
      sellingSelection.toggleMany,
      sellingSelection.toggleOne,
    ],
  );

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
    enabled: canManage && !addInvoicePopupOpen && !deletePopupOpen,
  });

  const totalPages = total === 0 ? 1 : Math.ceil(total / listBase.rowsPerPage);
  const selectedCount =
    sellingSelection.selectedIds.size + returnSelection.selectedIds.size;
  const isResetFilterDisabled =
    listBase.search.length === 0 &&
    searchRule === DEFAULT_SEARCH_RULE &&
    statusFilter === "all" &&
    taxFocusFilter === "all" &&
    listBase.isDefaultRange &&
    isDefaultSort &&
    isDefaultReturnSort &&
    listBase.page === 1 &&
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
    returnExpansion.resetExpansion();
    listBase.resetRuleInput();
  }

  async function handleDeleteSelectedInvoices(): Promise<void> {
    if (selectedCount === 0) {
      return;
    }

    const deletedCount = selectedCount;
    let deletedAny = false;
    setDeleting(true);

    try {
      const returnIds = Array.from(returnSelection.selectedIds);
      if (returnIds.length > 0) {
        await deleteReturnSellingDrafts(returnIds);
        returnSelection.clearSelection();
        deletedAny = true;
      }

      const sellingIds = Array.from(sellingSelection.selectedIds);
      if (sellingIds.length > 0) {
        await deleteSellingInvoices(sellingIds);
        sellingSelection.clearSelection();
        deletedAny = true;
      }

      setDeletePopupOpen(false);
      toast.success(
        dict.invoiceDeleteSuccess.replace("{count}", String(deletedCount)),
      );
    } catch (deleteError) {
      toast.error(resolveApiErrorMessage(deleteError, dict));
    } finally {
      if (deletedAny) {
        returnExpansion.resetExpansion();
        void refetch();
      }
      setDeleting(false);
    }
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
      toolbarActions={
        canManage ? (
          <>
            {selectedCount > 0 ? (
              <Button
                icon={<Trash2 className="h-3.5 w-3.5" />}
                accent="danger"
                size="sm"
                onClick={function openDeletePopup(): void {
                  setDeletePopupOpen(true);
                }}
              >
                {dict.deleteSelected} ({selectedCount})
              </Button>
            ) : null}
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
          </>
        ) : null
      }
      filterGroups={
        <>
          <ListFilterSelectGroup
            label={dict.status}
            options={statusOptions}
            value={statusFilter}
            onChange={function selectStatus(value): void {
              setStatusFilter(value);
              listBase.resetPageOnFilterChange();
            }}
            accentForValue={function statusAccent(
              optionValue,
            ): Accent {
              return (
                SELLING_STATUS_ACCENT[optionValue as SellingInvoiceStatus] ??
                "neutral"
              );
            }}
          />
          <ListFilterSelectGroup
            label={dict.taxFocusLabel}
            options={taxFocusOptions}
            value={taxFocusFilter}
            onChange={function selectTaxFocus(value): void {
              setTaxFocusFilter(value);
              listBase.resetPageOnFilterChange();
            }}
            accentForValue={function taxFocusAccent(optionValue): Accent {
              return optionValue === "true" ? "success" : "danger";
            }}
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
      error={error?.message}
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
        expansionAfterColumnCount: canManage ? 2 : 1,
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
      footer={
        canManage ? (
          <>
            <BulkDeleteInvoicesPopup
              open={deletePopupOpen}
              selectedCount={selectedCount}
              loading={deleting}
              onClose={function closeDeletePopup(): void {
                if (!deleting) {
                  setDeletePopupOpen(false);
                }
              }}
              onConfirm={handleDeleteSelectedInvoices}
            />
            <AddSellingInvoicePopup
              open={addInvoicePopupOpen}
              onClose={function closeCreatePopup(): void {
                setAddInvoicePopupOpen(false);
              }}
              onCreated={function navigateToCreatedInvoice(invoiceId): void {
                void refetch();
                router.push(`/manager/invoices/selling/${invoiceId}`);
              }}
            />
          </>
        ) : null
      }
    />
  );
}
