import ActivePill from "@/components/ui/ActivePill";
import type { Column } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { Barcode, CircleEllipsis, CirclePower, DollarSign, Warehouse } from "lucide-react";
import Link from "next/link";
import type { ProductApi } from "../types/productApi";

export function productColumns(dict: any): Column<ProductApi>[] {

  const stockMap = {
    0: "inStock",
    1: "lowStock",
    2: "outOfStock"
  } as const;

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
        const status = stockMap[p.stockStatus];

        return (
          <StatusPill
            status={status}
            label={dict[status]}
          />
        );
      }
    },

    {
      id: "active",
      header: dict.status,
      field: "active",
      sortable: true,
      icon: <CirclePower className="h-3.5 w-3.5" />,
      accessor: (p) => (
        <ActivePill
          active={p.active}
          label={p.active ? dict.active : dict.inactive}
        />
      )
    }

  ];
}