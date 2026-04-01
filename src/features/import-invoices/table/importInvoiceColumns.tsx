import { formatDate } from "@/components/types/ui";
import type { Column } from "@/components/ui/DataTable";
import type { Dictionary } from "@/lib/lang/i18n";
import {
  Braces,
  Clock,
  Hash,
  MessageSquare,
  Package,
  Receipt,
  Sigma,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";

import ImportInvoiceStatusPill from "../components/ImportInvoiceStatusPill";
import type { ImportInvoiceRow } from "../types/useImportInvoices";

function formatInvoiceNumber(
  invoiceId: string | null,
  dict: Dictionary,
): string {
  if (invoiceId) {
    return invoiceId;
  }
  return dict.noInvoiceNo;
}

export function importInvoiceColumns(
  dict: Dictionary,
): Column<ImportInvoiceRow>[] {
  return [
    {
      id: "invoiceNumber",
      header: dict.invoiceNumber,
      icon: <Hash className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <Link
          href={`/manager/invoices/import/${row.id}`}
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
      accessor: (row) => <ImportInvoiceStatusPill status={row.status} />,
      thClassName: "w-[140px]",
    },
    {
      id: "createdByUsername",
      header: dict.createdBy,
      icon: <UserIcon className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="text-text">
          {row.createdByUsername ?? "—"}
        </span>
      ),
      thClassName: "w-[160px]",
    },
    {
      id: "createdAt",
      header: dict.createdDate,
      icon: <Clock className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {formatDate(row.createdAt)}
        </span>
      ),
      thClassName: "w-[180px]",
    },
    {
      id: "totalImportPrice",
      header: dict.totalImportPriceLabel,
      icon: <Receipt className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: (row) => (
        <span className="tabular-nums text-text">
          {row.totalImportPrice.toLocaleString()}
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
      tdClassName: "max-w-[320px]",
    },
  ];
}
