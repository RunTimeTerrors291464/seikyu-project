import { formatDate } from "@/components/types/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Dictionary } from "@/lib/lang/i18n";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import {
  Braces,
  Clock,
  MessageSquare,
  Package,
  Receipt,
  ReceiptText,
  Sigma,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";

import type { PaginatedRowIndexParams } from "@/lib/table/paginatedRowDisplayIndex";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import SellingInvoiceStatusPill from "../components/SellingInvoiceStatusPill";
import type { SellingInvoiceRow } from "../hooks/useSellingInvoices";

function formatInvoiceNumber(
  invoiceId: string | null,
  dict: Dictionary,
): string {
  if (invoiceId) {
    return invoiceId;
  }
  return dict.noInvoiceNo;
}

export type SellingInvoiceColumnsOptions = {
  /** Base path for detail links, e.g. `/cashier/selling` or `/manager/invoices/selling`. */
  detailBasePath: string;
  /** When set, the index column uses `(page - 1) * rowsPerPage + rowIndex + 1`. */
  pagination?: PaginatedRowIndexParams;
};

export function sellingInvoiceColumns(
  dict: Dictionary,
  options: SellingInvoiceColumnsOptions,
): Column<SellingInvoiceRow>[] {
  const { detailBasePath, pagination: rowIndexPagination } = options;
  const base = detailBasePath.replace(/\/$/, "");

  return [
    rowIndexColumn<SellingInvoiceRow>({ pagination: rowIndexPagination }),
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
          href={`${base}/${row.id}`}
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
      accessor: (row) => <SellingInvoiceStatusPill status={row.status} />,
      thClassName: "w-[140px]",
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
      icon: <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      field: "confirmedAt",
      sortable: true,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {row.confirmedAt ? formatDate(row.confirmedAt) : "—"}
        </span>
      ),
      thClassName: "w-[180px]",
    },
    {
      id: "totalSellingPrice",
      header: dict.totalSellingPriceLabel,
      icon: <Receipt className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      field: "totalSellingPrice",
      sortable: true,
      accessor: (row) => (
        <span className="tabular-nums text-success">
          {formatPriceNumber(row.totalSellingPrice)}
        </span>
      ),
      thClassName: "w-[160px]",
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
