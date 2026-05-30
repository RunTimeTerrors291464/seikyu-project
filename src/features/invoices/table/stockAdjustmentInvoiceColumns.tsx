/**
 * Invoice-list columns for stock-adjustment invoices (one row per adjustment invoice).
 * Used by the stock-adjustment list page at `/manager/invoices/stock-adjustment`.
 */

import { formatDate } from "@/components/types/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Dictionary } from "@/lib/lang/i18n";
import {
  Braces,
  Clock,
  MessageSquare,
  Package,
  ReceiptText,
  Sigma,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";

import type { PaginatedRowIndexParams } from "@/lib/table/paginatedRowDisplayIndex";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import StockAdjustmentStatusPill from "../components/StockAdjustmentStatusPill";
import type { StockAdjustmentInvoiceRow } from "../hooks/useStockAdjustmentInvoices";

function formatInvoiceNumber(
  invoiceId: string | null,
  dict: Dictionary,
): string {
  if (invoiceId) {
    return invoiceId;
  }
  return dict.noInvoiceNo;
}

export function stockAdjustmentInvoiceColumns(
  dict: Dictionary,
  rowIndexPagination?: PaginatedRowIndexParams,
): Column<StockAdjustmentInvoiceRow>[] {
  return [
    rowIndexColumn<StockAdjustmentInvoiceRow>({ pagination: rowIndexPagination }),
    {
      id: "invoiceNumber",
      header: dict.invoiceNumber,
      icon: (
        <ReceiptText className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />
      ),
      field: "invoiceId",
      sortable: true,
      accessor: (row) => (
        <Link
          href={`/manager/invoices/stock-adjustment/${row.id}`}
          className="font-semibold text-primary hover:underline"
        >
          {formatInvoiceNumber(row.invoiceId, dict)}
        </Link>
      ),
      thClassName: "w-[140px]",
    },
    {
      id: "status",
      header: dict.status,
      icon: <Braces className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => <StockAdjustmentStatusPill status={row.status} />,
      thClassName: "w-[120px]",
    },
    {
      id: "userId",
      header: dict.confirmBy,
      icon: <UserIcon className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="text-text">
          {row.confirmedByUsername ?? "—"}
        </span>
      ),
      thClassName: "w-[160px]",
    },
    {
      id: "confirmedAt",
      header: dict.confirmDate,
      field: "confirmedAt",
      sortable: true,
      icon: <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {row.confirmedAt ? formatDate(row.confirmedAt) : "—"}
        </span>
      ),
      thClassName: "w-[180px]",
    },
    {
      id: "createdAt",
      header: dict.createdAt,
      field: "createdAt",
      sortable: true,
      icon: <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {row.draftAt ? formatDate(row.draftAt) : "—"}
        </span>
      ),
      thClassName: "w-[180px]",
    },
    {
      id: "totalProducts",
      header: dict.productsLabel,
      icon: <Package className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {row.totalProducts}
        </span>
      ),
      thClassName: "w-[120px]",
    },
    {
      id: "totalQuantity",
      header: dict.quantityLabel,
      field: "totalQuantity",
      sortable: true,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {row.totalQuantity}
        </span>
      ),
      thClassName: "w-[120px]",
    },
    {
      id: "notes",
      header: dict.noteLabel,
      icon: (
        <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />
      ),
      accessor: (row) => (
        <span className="truncate text-text">
          {row.notes && row.notes !== "" ? row.notes : "—"}
        </span>
      ),
      thClassName: "w-[320px]",
      tdClassName: "max-w-[320px]",
    },
  ];
}
