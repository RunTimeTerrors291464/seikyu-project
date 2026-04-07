import { formatDate } from "@/components/types/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Dictionary } from "@/lib/lang/i18n";
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

import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import type { PaginatedRowIndexParams } from "@/lib/table/paginatedRowDisplayIndex";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import ReturnImportInvoiceStatusPill from "../components/ReturnImportInvoiceStatusPill";
import type { ReturnImportInvoiceWithoutProductsDto } from "../services/returnImportInvoice.service";

function formatReturnInvoiceNumber(
  returnInvoiceId: string | null,
  dict: Dictionary,
): string {
  if (returnInvoiceId) {
    return returnInvoiceId;
  }
  return dict.noInvoiceNo;
}

function formatTotalReturnPrice(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return "—";
  }
  return formatPriceNumber(numeric);
}

export function returnImportInvoiceListColumns(
  dict: Dictionary,
  rowIndexPagination?: PaginatedRowIndexParams,
  /** When false, the index column is kept for alignment but cells are left empty (nested child tables). */
  numberRowIndex: boolean = true,
): Column<ReturnImportInvoiceWithoutProductsDto>[] {
  const indexColumn = rowIndexColumn<ReturnImportInvoiceWithoutProductsDto>({
    pagination: rowIndexPagination,
    numberRowIndex,
  });

  const bodyColumns: Column<ReturnImportInvoiceWithoutProductsDto>[] = [
    {
      id: "returnInvoiceNumber",
      header: dict.returnInvoiceNumber,
      icon: (
        <ReceiptText className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />
      ),
      field: "returnInvoiceId",
      sortable: true,
      accessor: function renderReturnId(row) {
        return (
          <Link
            href={`/manager/invoices/return-invoice/${row.id}`}
            className="font-semibold text-primary hover:underline"
          >
            {formatReturnInvoiceNumber(row.returnInvoiceId, dict)}
          </Link>
        );
      },
      thClassName: "w-[140px]",
    },
    {
      id: "status",
      header: dict.status,
      icon: <Braces className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderStatus(row) {
        return <ReturnImportInvoiceStatusPill status={row.status} />;
      },
      thClassName: "w-[140px]",
    },
    {
      id: "userId",
      header: dict.confirmBy,
      icon: <UserIcon className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      sortable: true,
      accessor: function renderConfirmedBy(row) {
        return (
          <span className="text-text">
            {row.confirmedByUsername ?? "—"}
          </span>
        );
      },
      thClassName: "w-[160px]",
    },
    {
      id: "confirmedAt",
      header: dict.confirmDate,
      icon: <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderConfirmedAt(row) {
        return (
          <span className="tabular-nums text-text">
            {row.confirmedAt ? formatDate(row.confirmedAt) : "—"}
          </span>
        );
      },
      thClassName: "w-[180px]",
    },
    {
      id: "createdAt",
      header: dict.createdAt,
      icon: <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      sortable: true,
      accessor: function renderCreatedAt(row) {
        return (
          <span className="tabular-nums text-text">
            {row.draftAt ? formatDate(row.draftAt) : "—"}
          </span>
        );
      },
      thClassName: "w-[180px]",
    },
    {
      id: "totalReturnPrice",
      header: dict.totalReturnPriceLabel,
      icon: <Receipt className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderTotal(row) {
        return (
          <span className="tabular-nums text-danger">
            {formatTotalReturnPrice(row.totalReturnPrice)}
          </span>
        );
      },
      thClassName: "w-[160px]",
    },
    {
      id: "totalProducts",
      header: dict.productsLabel,
      icon: <Package className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderProducts(row) {
        return (
          <span className="tabular-nums text-text">{row.totalProducts}</span>
        );
      },
      thClassName: "w-[120px]",
    },
    {
      id: "totalQuantity",
      header: dict.quantityLabel,
      icon: <Sigma className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderQty(row) {
        return (
          <span className="tabular-nums text-text">{row.totalQuantity}</span>
        );
      },
      thClassName: "w-[120px]",
    },
    {
      id: "notes",
      header: dict.noteLabel,
      icon: (
        <MessageSquare className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />
      ),
      accessor: function renderNotes(row) {
        const text = row.notes?.trim();
        return (
          <span className="truncate text-text">
            {text && text !== "" ? text : "—"}
          </span>
        );
      },
      thClassName: "w-[320px]",
      tdClassName: "max-w-[320px]",
    },
  ];

  return [indexColumn, ...bodyColumns];
}
