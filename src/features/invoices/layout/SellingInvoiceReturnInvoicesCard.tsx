"use client";

import DataTable from "@/components/ui/DataTable";
import { useDict } from "@/lib/lang/DictProvider";
import { Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReturnSellingInvoiceWithoutProductsDto } from "../services/returnSellingInvoice.service";
import { getReturnSellingInvoiceList } from "../services/returnSellingInvoice.service";
import { returnSellingInvoiceListColumns } from "../table/returnSellingInvoiceListColumns";

const RELATED_RETURNS_LIMIT = 100 as const;

type SellingInvoiceReturnInvoicesCardProps = {
  /** Human-readable selling invoice number (e.g. S26-0000001), not the internal UUID. */
  sellingInvoiceNo: string | null;
};

export default function SellingInvoiceReturnInvoicesCard({
  sellingInvoiceNo,
}: SellingInvoiceReturnInvoicesCardProps) {
  const dict = useDict();
  const columns = useMemo(
    () =>
      returnSellingInvoiceListColumns(dict, {
        page: 1,
        rowsPerPage: RELATED_RETURNS_LIMIT,
      }),
    [dict],
  );

  const [rows, setRows] = useState<ReturnSellingInvoiceWithoutProductsDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function loadRelatedReturns(): Promise<void> {
      if (!sellingInvoiceNo?.trim()) {
        setLoading(false);
        setRows([]);
        setErrorMessage("");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getReturnSellingInvoiceList({
          search: sellingInvoiceNo.trim(),
          searchBy: "sellingInvoiceId",
          limit: RELATED_RETURNS_LIMIT,
          page: 1,
        });

        if (!isMounted) {
          return;
        }

        setRows(response.invoices);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : dict.somethingWentWrong,
        );
        setRows([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadRelatedReturns();

    return () => {
      isMounted = false;
    };
  }, [sellingInvoiceNo, dict.somethingWentWrong]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card p-3">
      <h2 className="flex shrink-0 items-center gap-2 text-sm font-semibold text-text">
        <Undo2 className="h-4 w-4 text-muted" strokeWidth={2.5} />
        {dict.relatedReturnSellingInvoices}
      </h2>

      {errorMessage && (
        <div className="shrink-0 rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DataTable<ReturnSellingInvoiceWithoutProductsDto>
          columns={columns}
          data={rows}
          loading={loading}
          getRowId={(row) => row.id}
          emptyMessage={dict.noRelatedReturns}
          maxHeight="fill"
        />
      </div>
    </div>
  );
}
