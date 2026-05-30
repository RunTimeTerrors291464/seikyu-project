"use client";

import type { Column } from "@/components/ui/DataTable";
import DataTable from "@/components/ui/DataTable";
import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { Undo2 } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_RELATED_RETURNS_LIMIT = 100 as const;
const DEFAULT_RELATED_RETURNS_PAGE = 1 as const;

type RelatedReturnInvoicesLoadArgs<TSearchBy extends string> = {
  search: string;
  searchBy: TSearchBy;
  limit: number;
  page: number;
};

type RelatedReturnInvoicesLoadResult<TRow> = {
  invoices: TRow[];
};

type RelatedReturnInvoicesCardProps<TRow, TSearchBy extends string> = {
  searchValue: string | null;
  searchBy: TSearchBy;
  title: string;
  emptyMessage: string;
  columns: Column<TRow>[];
  getRowId: (row: TRow) => string;
  loadRows: (
    args: RelatedReturnInvoicesLoadArgs<TSearchBy>,
  ) => Promise<RelatedReturnInvoicesLoadResult<TRow>>;
};

/**
 * Renders a shared table card for return invoices related to a source invoice.
 *
 * @param props - Typed adapter props for fetching and rendering related rows.
 * @returns A reusable return-invoice relation card.
 */
export default function RelatedReturnInvoicesCard<
  TRow,
  TSearchBy extends string,
>({
  searchValue,
  searchBy,
  title,
  emptyMessage,
  columns,
  getRowId,
  loadRows,
}: RelatedReturnInvoicesCardProps<TRow, TSearchBy>) {
  const dict = useDict();
  const [rows, setRows] = useState<TRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadRelatedReturns(): Promise<void> {
      if (!searchValue?.trim()) {
        setLoading(false);
        setRows([]);
        setErrorMessage("");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await loadRows({
          search: searchValue.trim(),
          searchBy,
          limit: DEFAULT_RELATED_RETURNS_LIMIT,
          page: DEFAULT_RELATED_RETURNS_PAGE,
        });

        if (!isMounted) {
          return;
        }

        setRows(response.invoices);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(resolveApiErrorMessage(error, dict));
        setRows([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadRelatedReturns();

    return function cleanupLoadRelatedReturns(): void {
      isMounted = false;
    };
  }, [dict, loadRows, searchBy, searchValue]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card p-3">
      <h2 className="flex shrink-0 items-center gap-2 text-sm font-semibold text-text">
        <Undo2 className="h-4 w-4 text-muted" strokeWidth={2.5} />
        {title}
      </h2>

      {errorMessage && (
        <div className="shrink-0 rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DataTable<TRow>
          columns={columns}
          data={rows}
          loading={loading}
          getRowId={function getDataTableRowId(row): string {
            return getRowId(row);
          }}
          emptyMessage={emptyMessage}
          maxHeight="fill"
        />
      </div>
    </div>
  );
}
