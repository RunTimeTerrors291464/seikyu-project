"use client";

import type { Column } from "@/components/ui/DataTable";
import type { Dictionary } from "@/lib/lang/i18n";
import { Barcode, Package, Ruler } from "lucide-react";

export type ProductIdentityRow = {
  productSku: string;
  productName: string;
  productUnit: string;
};

/**
 * Read-only SKU, product name, and unit columns for invoice product-line tables.
 *
 * @param dict - UI strings.
 * @returns Three column definitions.
 */
export function buildProductIdentityColumns<T extends ProductIdentityRow>(
  dict: Dictionary,
): Column<T>[] {
  return [
    {
      id: "productSku",
      header: dict.sku,
      icon: <Barcode className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderSku(row) {
        return <span className="text-text">{row.productSku || "—"}</span>;
      },
      thClassName: "w-[140px]",
    },
    {
      id: "productName",
      header: dict.productName,
      icon: <Package className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderName(row) {
        return <span className="text-text">{row.productName || "—"}</span>;
      },
      thClassName: "w-[220px]",
    },
    {
      id: "productUnit",
      header: dict.unit,
      icon: <Ruler className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />,
      accessor: function renderUnit(row) {
        return <span className="text-text">{row.productUnit || "—"}</span>;
      },
      thClassName: "w-[120px]",
    },
  ];
}
