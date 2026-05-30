"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import TablePagination from "@/components/ui/TablePagination";
import { SELLING_STATUS_ACCENT } from "@/features/invoices/components/SellingInvoiceStatusPill";
import {
  SELLING_INVOICE_STATUS_OPTIONS,
  SellingInvoiceStatusFilter,
} from "@/features/invoices/filters/sellingInvoiceFilters";
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
import { Filter, Hash, Package, RotateCcw, User as UserIcon } from "lucide-react";
const RETURN_CHILDREN_LIMIT = 100;

type SellingInvoiceSortBy = "invoiceId" | "totalSellingPrice" | "confirmedAt";
type ReturnSellingInvoiceSortBy = "returnInvoiceId" | "userId" | "createdAt";
type SortOrder = "asc" | "desc";

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

export default function ManagerSellingInvoicesPage() {
  const dict = useDict();

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(30);

  const columns = useMemo(
    () =>
      sellingInvoiceColumns(dict, {
        detailBasePath: "/manager/invoices/selling",
        pagination: { page, rowsPerPage },
      }),
    [dict, page, rowsPerPage],
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

  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [returnChildrenBySellingId, setReturnChildrenBySellingId] = useState<
    Record<string, ReturnSellingInvoiceWithoutProductsDto[]>
  >({});
  const [returnChildrenLoading, setReturnChildrenLoading] = useState<
    Record<string, boolean>
  >({});
  const [search, setSearch] = useState<string>("");
  const [searchRule, setSearchRule] = useState<
    "invoiceId" | "userId" | "productId"
  >("invoiceId");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] =
    useState<SellingInvoiceStatusFilter>("all");
  const [ruleInputResetKey, setRuleInputResetKey] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SellingInvoiceSortBy | undefined>(
    undefined,
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [returnSortBy, setReturnSortBy] = useState<
    ReturnSellingInvoiceSortBy | undefined
  >(undefined);
  const [returnSortOrder, setReturnSortOrder] = useState<SortOrder>("asc");

  const { rows, total, loading } = useSellingInvoices({
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
    children: ReturnSellingInvoiceWithoutProductsDto[],
    currentSortBy: ReturnSellingInvoiceSortBy | undefined,
    currentSortOrder: SortOrder,
  ): ReturnSellingInvoiceWithoutProductsDto[] {
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

      return compareNullableString(left.draftAt, right.draftAt, currentSortOrder);
    });

    return sorted;
  }

  function handleSort(nextField: string): void {
    if (
      nextField !== "invoiceId" &&
      nextField !== "totalSellingPrice" &&
      nextField !== "confirmedAt"
    ) {
      return;
    }

    if (sortBy !== nextField) {
      setSortBy(nextField as SellingInvoiceSortBy);
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
      setReturnSortBy(nextField as ReturnSellingInvoiceSortBy);
      setReturnSortOrder("asc");
      return;
    }

    setReturnSortOrder(returnSortOrder === "asc" ? "desc" : "asc");
  }

  function handleToggleExpandRow(rowId: string | number): void {
    const id = String(rowId);

    if (expandedRowIds.has(id)) {
      setExpandedRowIds(function collapseExpanded(prev) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setReturnChildrenBySellingId(function dropCache(current) {
        const copy = { ...current };
        delete copy[id];
        return copy;
      });
      setReturnChildrenLoading(function clearLoading(current) {
        const copy = { ...current };
        delete copy[id];
        return copy;
      });
      return;
    }

    if (returnChildrenLoading[id]) {
      return;
    }

    const row = rows.find((candidate) => candidate.id === id);
    if (!row || row.returnCount <= 0) {
      return;
    }

    setExpandedRowIds(function expandRow(prev) {
      if (prev.has(id)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(id);
      return next;
    });

    setReturnChildrenLoading(function setLoading(current) {
      return { ...current, [id]: true };
    });

    void (async function fetchReturns(): Promise<void> {
      try {
        const response = await getReturnSellingInvoiceList({
          search: row.invoiceId ?? undefined,
          searchBy: "sellingInvoiceId",
          limit: RETURN_CHILDREN_LIMIT,
          page: 1,
        });

        setReturnChildrenBySellingId(function mergeChildren(prev) {
          return { ...prev, [id]: response.invoices };
        });
      } catch (error) {
        console.error("Failed to fetch return selling invoices", error);
        setReturnChildrenBySellingId(function setEmpty(prev) {
          return { ...prev, [id]: [] };
        });
      } finally {
        setReturnChildrenLoading(function finishLoading(prev) {
          return { ...prev, [id]: false };
        });
      }
    })();
  }

  const totalPages = total === 0 ? 1 : Math.ceil(total / rowsPerPage);
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
    setReturnChildrenBySellingId({});
    setReturnChildrenLoading({});
    setRuleInputResetKey((value) => value + 1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4">
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex items-center justify-start gap-2">
          <h1 className="text-xl font-semibold">{dict.sellingInvoicesManager}</h1>
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
              let normalized: "invoiceId" | "userId" | "productId" =
                "invoiceId";
              if (rule === dict.confirmBy) {
                normalized = "userId";
              } else if (rule === dict.productIdSearchLabel) {
                normalized = "productId";
              }
              setSearchRule(normalized);
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
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{dict.status}</span>

            <div className="flex gap-1">
              {SELLING_INVOICE_STATUS_OPTIONS.map((option) => (
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

      <DataTable<SellingInvoiceRow>
        columns={columns}
        data={rows}
        loading={loading}
        getRowId={(row) => row.id}
        sortField={sortBy}
        sortDirection={sortOrder}
        onSort={handleSort}
        maxHeight="fill"
        expansionAfterColumnCount={1}
        expandedRowIds={expandedRowIds}
        onToggleExpandRow={handleToggleExpandRow}
        canExpandRow={(row) => row.returnCount > 0}
        renderExpandedRow={function renderExpandedRow(row) {
          const sellingId = row.id;
          const childLoading = returnChildrenLoading[sellingId] === true;
          const children = returnChildrenBySellingId[sellingId] ?? [];
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
            <DataTable<ReturnSellingInvoiceWithoutProductsDto>
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
    </div>
  );
}
