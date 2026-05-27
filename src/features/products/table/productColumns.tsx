import type { Column } from "@/components/ui/DataTable";
import ActivePill from "@/features/products/components/ActivePill";
import StatusPill from "@/features/products/components/StockStatusPill";
import { Dictionary } from "@/lib/lang/i18n";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import type { PaginatedRowIndexParams } from "@/lib/table/paginatedRowDisplayIndex";
import { rowIndexColumn } from "@/lib/table/rowIndexColumn";
import { Barcode, CircleEllipsis, CirclePower, DollarSign, Edit2, Ruler, Warehouse } from "lucide-react";
import Link from "next/link";
import { Product } from "../types/product";

/**
 * Columns for the product inventory table, including a paginated row index column.
 *
 * @param dict - UI strings.
 * @param rowIndexPagination - Page and page size for global row labels; omit for non-paginated tables.
 */
export function productColumns(
  dict: Dictionary,
  rowIndexPagination?: PaginatedRowIndexParams,
): Column<Product>[] {

  return [
    rowIndexColumn<Product>({ pagination: rowIndexPagination }),

    {
      id: "sku",
      header: dict.sku,
      field: "sku",
      sortable: true,
      icon: <Barcode className="h-3.5 w-3.5" />,
      accessor: (p) => (
        <Link
          href={`/manager/product-inventory/${p.id}`}
          className="font-semibold text-blue-600 hover:underline"
        >
          {p.sku}
        </Link>
      )
    },

    {
      id: "productName",
      header: dict.productName,
      sortable: true,
      icon: <Edit2 className="h-3.5 w-3.5" />,
      sortAccessor: (p) =>
        (p.productNames?.[0] ?? "").toLowerCase(),

      accessor: (p) =>
        p.productNames?.[0] ?? "-"
    },

    {
      id: "unit",
      header: dict.unit,
      field: "productUnitName",
      sortable: true,
      icon: <Ruler className="h-3.5 w-3.5" />,
      sortAccessor: (p) =>
        p.productUnitName
    },

    {
      id: "importPrice",
      header: dict.importPrice,
      field: "importPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5" />,
      accessor: (p) => formatPriceNumber(p.importPrice)
    },

    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      field: "sellingPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5" />,
      accessor: (p) => formatPriceNumber(p.sellingPrice)
    },

    {
      id: "inventoryStock",
      header: dict.stock,
      field: "inventoryStock",
      sortable: true,
      icon: <Warehouse className="h-3.5 w-3.5" />,
      accessor: (p) => (
        <span className="tabular-nums text-text">{p.inventoryStock}</span>
      ),
    },

    {
      id: "stockStatus",
      header: dict.stockStatus,
      field: "stockStatus",
      sortable: true,
      icon: <CircleEllipsis className="h-3.5 w-3.5" />,
      accessor: (p) => {
        return (
          <StatusPill
            status={p.stockStatus}
          />
        );
      }
    },

    {
      id: "active",
      header: dict.status,
      field: "isActive",
      icon: <CirclePower className="h-3.5 w-3.5" />,
      accessor: (p) => (
        <ActivePill
          active={p.isActive}
        />
      )
    }

  ];
}