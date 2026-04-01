"use client";

import { useState } from "react";

import { ACCENT_STYLES } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import RuleInput from "@/components/ui/RuleInput";
import TablePagination from "@/components/ui/TablePagination";
import Tooltip from "@/components/ui/ToolTips";
import {
  STATUS_ACCENT,
} from "@/features/import-invoices/components/ImportInvoiceStatusPill";
import {
  IMPORT_INVOICE_STATUS_OPTIONS,
  ImportInvoiceStatusFilter,
} from "@/features/import-invoices/filters/importInvoiceFilters";
import { importInvoiceColumns } from "@/features/import-invoices/table/importInvoiceColumns";
import { useDict } from "@/lib/lang/DictProvider";

import {
  Filter,
  Hash,
  Plus,
  RotateCcw,

  User as UserIcon
} from "lucide-react";

import AddImportInvoicePopup from "@/features/import-invoices/layout/AddImportInvoicePopup";
import { ImportInvoiceRow, useImportInvoices } from "@/features/import-invoices/types/useImportInvoices";

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
  const dict = useDict();
  const columns = importInvoiceColumns(dict);

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

  const { rows, total, loading, refetch } = useImportInvoices({
    page,
    limit: rowsPerPage,
    search: search || undefined,
    searchBy: search ? searchRule : undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const totalPages =
    total === 0 ? 1 : Math.ceil(total / rowsPerPage);

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden max-h-[100vh]">
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="flex items-center justify-start gap-2">
          <h1 className="text-xl font-semibold">
            {dict.importInvoices}
          </h1>
        </div>

        <div className="w-full max-w-xl">
          <RuleInput
            options={[
              {
                label: dict.invoiceNumber,
                icon: <Hash className="h-3 w-3" />,
              },
              {
                label: dict.createdBy,
                icon: <UserIcon className="h-3 w-3" />,
              },
            ]}
            placeholder={dict.searchPlaceholder}
            onChange={({ rule, value }) => {
              const normalizedRule =
                rule === dict.createdBy ? "userId" : "invoiceId";
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

          <Tooltip content={dict.refresh}>
            <Button
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              accent="neutral"
              size="sm"
              onClick={refetch}
            >
              {dict.refresh}
            </Button>
          </Tooltip>

          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            accent="primary"
            size="sm"
            onClick={() => setAddInvoicePopupOpen(true)}
          >
            {dict.addNewInvoice}
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

      <div className="min-h-0 grow flex flex-col">
        <DataTable<ImportInvoiceRow>
          columns={columns}
          data={rows}
          loading={loading}
          getRowId={(row) => row.id}
          maxHeight="fill"
        />
      </div>

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
        onCreated={refetch}
      />
    </div>
  );
}
