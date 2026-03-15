import { Barcode, DollarSign, Package, Warehouse } from "lucide-react";
import Link from "next/link";

import type { Column } from "@/components/ui/DataTable";
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
    }

  ];

}