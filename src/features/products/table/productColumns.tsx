import type { Column } from "@/components/ui/DataTable";
import ActivePill from "@/features/products/components/ActivePill";
import StatusPill from "@/features/products/components/StockStatusPill";
import { Dictionary } from "@/lib/lang/i18n";
import { Barcode, CircleEllipsis, CirclePower, DollarSign, Warehouse } from "lucide-react";
import Link from "next/link";
import { Product } from "../types/product";

export function productColumns(dict: Dictionary): Column<Product>[] {

  return [

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
      id: "name",
      header: dict.productName,
      sortable: true,

      sortAccessor: (p) =>
        (p.productNames?.[0] ?? "").toLowerCase(),

      accessor: (p) =>
        p.productNames?.[0] ?? "-"
    },

    {
      id: "unit",
      header: dict.unit,
      field: "productUnitName",
      sortable: true
    },

    {
      id: "importPrice",
      header: dict.importPrice,
      field: "importPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5" />,
      accessor: (p) => p.importPrice.toLocaleString()
    },

    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      field: "sellingPrice",
      sortable: true,
      icon: <DollarSign className="h-3.5 w-3.5" />,
      accessor: (p) => p.sellingPrice.toLocaleString()
    },

    {
      id: "stock",
      header: dict.stock,
      field: "inventoryStock",
      sortable: true,
      icon: <Warehouse className="h-3.5 w-3.5" />
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
      sortable: true,
      icon: <CirclePower className="h-3.5 w-3.5" />,
      accessor: (p) => (
        <ActivePill
          active={p.isActive}
        />
      )
    }

  ];
}