import ActivePill from "@/components/ui/ActivePill";
import type { Column } from "@/components/ui/DataTable";
import StatusPill from "@/components/ui/StatusPill";
import { Barcode, CircleEllipsis, CirclePower, DollarSign, Package, Warehouse } from "lucide-react";
import Link from "next/link";
import type { ProductStatus } from "../types/product";
import type { ProductApi } from "../types/productApi";

export function productColumns(dict: any): Column<ProductApi>[] {

  return [

    {
      id: "sku",
      header: dict.sku,
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
      icon: <Package className="h-3.5 w-3.5" />,
      accessor: (p) => p.productNames?.[0] ?? "-"
    },

    {
      id: "unit",
      header: dict.unit,
      accessor: (p) => p.productUnitName
    },

    {
      id: "importPrice",
      header: dict.importPrice,
      icon: <DollarSign className="h-3.5 w-3.5" />,
      accessor: (p) => p.importPrice.toLocaleString()
    },

    {
      id: "sellingPrice",
      header: dict.sellingPrice,
      icon: <DollarSign className="h-3.5 w-3.5" />,
      accessor: (p) => p.sellingPrice.toLocaleString()
    },

    {
      id: "stock",
      header: dict.stock,
      icon: <Warehouse className="h-3.5 w-3.5" />,
      accessor: (p) => p.inventoryStock
    },

    {
      id: "stockStatus",
      header: dict.stockStatus,
      icon: <CircleEllipsis className="h-3.5 w-3.5" />,
      accessor: (p) => {

        const map: Record<number, ProductStatus> = {
          0: "inStock",
          1: "lowStock",
          2: "outOfStock"
        };

        const status = map[p.stockStatus];

        const labelMap = {
          inStock: dict.inStock,
          lowStock: dict.lowStock,
          outOfStock: dict.outOfStock
        };

        return (
          <StatusPill
            status={status}
            label={labelMap[status]}
          />
        );
      }
    },

    {
      id: "active",
      header: dict.status,
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