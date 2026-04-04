"use client";

import { useMemo, useState } from "react";

import { ACCENT_STYLES } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import TablePagination from "@/components/ui/TablePagination";
import {
  STATUS_ACCENT,
} from "@/features/invoices/components/ImportInvoiceStatusPill";
import {
  IMPORT_INVOICE_STATUS_OPTIONS,
  ImportInvoiceStatusFilter,
} from "@/features/invoices/filters/importInvoiceFilters";
import type { ReturnImportInvoiceWithoutProductsDto } from "@/features/invoices/services/returnImportInvoice.service";
import { getReturnImportInvoiceList } from "@/features/invoices/services/returnImportInvoice.service";
import { importInvoiceColumns } from "@/features/invoices/table/importInvoiceColumns";
import { returnImportInvoiceListColumns } from "@/features/invoices/table/returnImportInvoiceListColumns";
import { useDict } from "@/lib/lang/DictProvider";

import {
  Filter,
  Hash,
  Plus,
  RotateCcw,

  User as UserIcon
} from "lucide-react";

import AddImportInvoicePopup from "@/features/invoices/layout/CreateImportInvoicePopup";
import { ImportInvoiceRow, useImportInvoices } from "@/features/invoices/types/useImportInvoices";
import { useRouter } from "next/navigation";

const RETURN_CHILDREN_LIMIT = 100;
type ImportInvoiceSortBy = "invoiceId" | "userId" | "createdAt";
type ReturnImportInvoiceSortBy = "returnInvoiceId" | "userId" | "createdAt";
type SortOrder = "asc" | "desc";

function getStatusFilterClass(
  optionValue: ImportInvoiceStatusFilter,
  statusFilter: ImportInvoiceStatusFilter,
): string {
  if (optionValue === "all") {
    return statusFilter === optionValue
      ? "border-text bg-text text-bg"
      : "border-border bg-card text-muted";
  }

  const accent = STATUS_ACCENT[optionValue] ?? "neutral";
  return `${ACCENT_STYLES[accent]} ${statusFilter === optionValue ? "opacity-100" : "opacity-70"}`;
}

export default function ImportInvoicesListPage() {
  const router = useRouter();
  const dict = useDict();
  const columns = importInvoiceColumns(dict);
  const returnColumns = useMemo(
    () => returnImportInvoiceListColumns(dict),
    [dict],
  );

  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [returnChildrenByImportId, setReturnChildrenByImportId] = useState<
    Record<string, ReturnImportInvoiceWithoutProductsDto[]>
  >({});
  const [returnChildrenLoading, setReturnChildrenLoading] = useState<
    Record<string, boolean>
  >({});

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [searchRule, setSearchRule] = useState<"invoiceId" | "userId">(
    "invoiceId",
  );
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] =
    useState<ImportInvoiceStatusFilter>("all");
  const [addInvoicePopupOpen, setAddInvoicePopupOpen] = useState<boolean>(false);
  const [ruleInputResetKey, setRuleInputResetKey] = useState<number>(0);
  const [sortBy, setSortBy] = useState<ImportInvoiceSortBy | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [returnSortBy, setReturnSortBy] = useState<ReturnImportInvoiceSortBy | undefined>(undefined);
  const [returnSortOrder, setReturnSortOrder] = useState<SortOrder>("asc");

  const { rows, total, loading, refetch } = useImportInvoices({
    page,
    limit: rowsPerPage,
    search: search || undefined,
    searchBy: search ? searchRule : undefined,
    sortBy,
    sortOrder: sortBy ? sortOrder : undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  function compareNullableString(
    leftValue: string | null,
    rightValue: string | null,
    currentSortOrder: SortOrder,
  ): number {
    const left = leftValue ?? "";
    const right = rightValue ?? "";
    const baseCompare = left.localeCompare(right);
    return currentSortOrder === "asc" ? baseCompare : -baseCompare;
  }

  function sortReturnChildrenRows(
    children: ReturnImportInvoiceWithoutProductsDto[],
    currentSortBy: ReturnImportInvoiceSortBy | undefined,
    currentSortOrder: SortOrder,
  ): ReturnImportInvoiceWithoutProductsDto[] {
    if (!currentSortBy) {
      return children;
    }

    const sorted = [...children];
    sorted.sort(function compareChildren(left, right): number {
      if (currentSortBy === "returnInvoiceId") {
        return compareNullableString(
          left.returnInvoiceId,
          right.returnInvoiceId,
          currentSortOrder,
        );
      }

      if (currentSortBy === "userId") {
        return compareNullableString(
          left.confirmedByUsername,
          right.confirmedByUsername,
          currentSortOrder,
        );
      }

      return compareNullableString(
        left.draftAt,
        right.draftAt,
        currentSortOrder,
      );
    });

    return sorted;
  }

  function handleSort(nextField: string): void {
    if (
      nextField !== "invoiceId" &&
      nextField !== "userId" &&
      nextField !== "createdAt"
    ) {
      return;
    }

    if (sortBy !== nextField) {
      setSortBy(nextField);
      setSortOrder("asc");
      setPage(1);
      return;
    }

    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    setPage(1);
  }

  function handleReturnSort(nextField: string): void {
    if (
      nextField !== "returnInvoiceId" &&
      nextField !== "userId" &&
      nextField !== "createdAt"
    ) {
      return;
    }

    if (returnSortBy !== nextField) {
      setReturnSortBy(nextField);
      setReturnSortOrder("asc");
      return;
    }

    setReturnSortOrder(returnSortOrder === "asc" ? "desc" : "asc");
  }

  function handleToggleExpandRow(rowId: string | number): void {
    const id = String(rowId);

    setExpandedRowIds(function toggleExpanded(prev) {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
        setReturnChildrenByImportId(function dropCache(current) {
          const copy = { ...current };
          delete copy[id];
          return copy;
        });
        setReturnChildrenLoading(function clearLoading(current) {
          const copy = { ...current };
          delete copy[id];
          return copy;
        });
        return next;
      }

      const row = rows.find((candidate) => candidate.id === id);
      if (!row || row.returnCount <= 0) {
        return prev;
      }

      next.add(id);
      setReturnChildrenLoading(function setLoading(current) {
        return { ...current, [id]: true };
      });

      void (async function fetchReturns(): Promise<void> {
        try {
          const row = rows.find((candidate) => candidate.id === id);
          const importInvoiceNo = row?.invoiceId?.trim() ?? "";

          if (!importInvoiceNo) {
            setReturnChildrenByImportId(function setEmpty(prev) {
              return { ...prev, [id]: [] };
            });
            return;
          }

          const response = await getReturnImportInvoiceList({
            search: importInvoiceNo,
            searchBy: "importInvoiceId",
            limit: RETURN_CHILDREN_LIMIT,
            page: 1,
          });

          setReturnChildrenByImportId(function mergeChildren(prev) {
            return { ...prev, [id]: response.invoices };
          });
        } finally {
          setReturnChildrenLoading(function finishLoading(prev) {
            return { ...prev, [id]: false };
          });
        }
      })();

      return next;
    });
  }

  const totalPages =
    total === 0 ? 1 : Math.ceil(total / rowsPerPage);
  const isResetFilterDisabled =
    search.length === 0 &&
    searchRule === "invoiceId" &&
    statusFilter === "all" &&
    sortBy === undefined &&
    page === 1 &&
    showFilters === false &&
    expandedRowIds.size === 0;

  function handleResetFilters(): void {
    setSearch("");
    setSearchRule("invoiceId");
    setStatusFilter("all");
    setSortBy(undefined);
    setSortOrder("asc");
    setReturnSortBy(undefined);
    setReturnSortOrder("asc");
    setPage(1);
    setShowFilters(false);
    setExpandedRowIds(new Set());
    setReturnChildrenByImportId({});
    setReturnChildrenLoading({});
    setRuleInputResetKey((value) => value + 1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4">
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex items-center justify-start gap-2">
          <h1 className="text-xl font-semibold">
            {dict.importInvoices}
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
            ]}
            placeholder={dict.searchPlaceholder}
            onChange={({ rule, value }) => {
              const normalizedRule =
                rule === dict.confirmBy ? "userId" : "invoiceId";
              setSearchRule(
                normalizedRule as "invoiceId" | "userId",
              );
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
            {dict.createNewImportDraft}
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
              {IMPORT_INVOICE_STATUS_OPTIONS.map((option) => (
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
        </div>
      )}

      <DataTable<ImportInvoiceRow>
        columns={columns}
        data={rows}
        loading={loading}
        getRowId={(row) => row.id}
        sortField={sortBy}
        sortDirection={sortOrder}
        onSort={handleSort}
        maxHeight="fill"
        expandedRowIds={expandedRowIds}
        onToggleExpandRow={handleToggleExpandRow}
        canExpandRow={(row) => row.returnCount > 0}
        renderExpandedRow={function renderExpandedRow(row) {
          const importId = row.id;
          const childLoading = returnChildrenLoading[importId] === true;
          const children = returnChildrenByImportId[importId] ?? [];
          const sortedChildren = sortReturnChildrenRows(
            children,
            returnSortBy,
            returnSortOrder,
          );

          if (childLoading) {
            return (
              <div className="px-4 py-6 text-center text-sm text-muted">
                {dict.loading}
              </div>
            );
          }

          if (sortedChildren.length === 0) {
            return (
              <div className="px-4 py-3 text-sm text-muted">
                {dict.noRelatedReturns}
              </div>
            );
          }

          return (
            <DataTable<ReturnImportInvoiceWithoutProductsDto>
              columns={returnColumns}
              data={sortedChildren}
              getRowId={(r) => r.id}
              sortField={returnSortBy}
              sortDirection={returnSortOrder}
              onSort={handleReturnSort}
              maxHeight="240px"
              className="overflow-x-hidden"
              showHeader={false}
              embedded
              leadingRail
              emptyMessage={dict.noRelatedReturns}
            />
          );
        }}
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

      <AddImportInvoicePopup
        open={addInvoicePopupOpen}
        onClose={() => setAddInvoicePopupOpen(false)}
        onCreated={(invoiceId) => {
          void refetch();
          router.push(`/manager/invoices/import/${invoiceId}`);
        }}
      />
    </div>
  );
}
