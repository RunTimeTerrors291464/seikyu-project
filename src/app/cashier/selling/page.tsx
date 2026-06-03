"use client";

import { useCallback, useMemo, useState } from "react";

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
import { Filter, Hash, Plus, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import type { SellingInvoiceStatus } from "@/features/invoices/services/sellingInvoice.service";

type SellingInvoiceSortBy = "invoiceId" | "totalSellingPrice" | "confirmedAt";
type SortOrder = "asc" | "desc";

const DEFAULT_SORT_BY: SellingInvoiceSortBy = "confirmedAt";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

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

export default function CashierSellingInvoicesPage() {
  const router = useRouter();
  const dict = useDict();
  const canCreateSelling = useMayCreateSellingInvoice();

  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(30);

  const columns = useMemo(
    () =>
      sellingInvoiceColumns(dict, {
        detailBasePath: "/cashier/selling",
        pagination: { page, rowsPerPage },
      }),
    [dict, page, rowsPerPage],
  );
  const [search, setSearch] = useState<string>("");
  const [searchRule, setSearchRule] = useState<
    "invoiceId" | "userId" | "productId"
  >("invoiceId");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] =
    useState<SellingInvoiceStatusFilter>("all");
  const [addInvoicePopupOpen, setAddInvoicePopupOpen] = useState<boolean>(false);
  const [ruleInputResetKey, setRuleInputResetKey] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SellingInvoiceSortBy>(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);

  const { rows, total, loading, refetch } = useSellingInvoices({
    page,
    limit: rowsPerPage,
    search: search || undefined,
    searchBy: search ? searchRule : undefined,
    sortBy,
    sortOrder,
    status: statusFilter === "all" ? undefined : statusFilter,
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

  const totalPages = total === 0 ? 1 : Math.ceil(total / rowsPerPage);
  const isResetFilterDisabled =
    search.length === 0 &&
    searchRule === "invoiceId" &&
    statusFilter === "all" &&
    sortBy === DEFAULT_SORT_BY &&
    sortOrder === DEFAULT_SORT_ORDER &&
    page === 1 &&
    showFilters === false;

  function handleResetFilters(): void {
    setSearch("");
    setSearchRule("invoiceId");
    setStatusFilter("all");
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
    setPage(1);
    setShowFilters(false);
    setRuleInputResetKey((value) => value + 1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4">
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex items-center justify-start gap-2">
          <h1 className="text-xl font-semibold">{dict.salesInvoices}</h1>
        </div>

        <div className="w-full max-w-xl">
          <RuleInput
            key={ruleInputResetKey}
            options={[
              {
                label: dict.invoiceNumber,
                icon: <Hash className="h-3 w-3" />,
              },
              // {
              //   label: dict.confirmBy,
              //   icon: <UserIcon className="h-3 w-3" />,
              // },
              // {
              //   label: dict.productSkuSearchLabel,
              //   icon: <Package className="h-3 w-3" />,
              // },
            ]}
            placeholder={dict.searchPlaceholder}
            onChange={({ rule, value }) => {
              const ruleMap: Record<string, "invoiceId"> = {
                [dict.invoiceNumber]: "invoiceId",
              };
              setSearchRule(ruleMap[rule] as "invoiceId");
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

          {canCreateSelling ? (
            <Button
              icon={<Plus className="h-3.5 w-3.5" />}
              accent="primary"
              size="sm"
              onClick={() => setAddInvoicePopupOpen(true)}
            >
              {dict.createNewSellingInvoice}
            </Button>
          ) : null}
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

      {canCreateSelling ? (
        <AddSellingInvoicePopup
          open={addInvoicePopupOpen}
          onClose={() => setAddInvoicePopupOpen(false)}
          onCreated={(invoiceId) => {
            void refetch();
            router.push(`/cashier/selling/${invoiceId}`);
          }}
        />
      ) : null}
    </div>
  );
}
