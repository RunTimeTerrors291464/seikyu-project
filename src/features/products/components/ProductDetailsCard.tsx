"use client";

import { AlertTriangle, Barcode, DollarSign, Ruler, Warehouse } from "lucide-react";

import { Accent } from "@/components/types/ui";
import { Field, Input, StatDisplay, Textarea } from "@/components/ui/Fields";
import { Dictionary } from "@/lib/lang/i18n";
import { Product } from "../types/product";

type Props = {
  product: Product;
  update: (k: any, v: any) => void;
  dict: Dictionary;
};


export default function ProductDetailsCard({
  product,
  update,
  dict,
}: Props) {

  const stock = getStockStatus(product, dict);

  return (
    <div className="card p-5 space-y-4 rounded-lg">

      <h2 className="text-sm font-semibold text-text">
        {dict.productDetails}
      </h2>

      {/* SKU */}
      <Field label={dict.sku} icon={<Barcode className="h-3 w-3" />}>
        <Input
          value={product.sku || ""}
          onChange={(v) => update("sku", v)}
        />
      </Field>

      {/* CURRENT STOCK */}
      <Field
        label={dict.currentStock}
        icon={<Warehouse className="h-3 w-3" />}
      >
        <StatDisplay
          value={product.inventoryStock || 0}
          status={product.stockStatus}
          label={stock.label}
          accent={stock.accent}
        />
      </Field>

      {/* UNIT */}
      <Field label={dict.unit} icon={<Ruler className="h-3 w-3" />}>
        <Input
          value={product.productUnitName || ""}
          onChange={(v) => update("unit", v)}
        />
      </Field>

      {/* IMPORT PRICE */}
      <Field
        label={dict.importPrice}
        icon={<DollarSign className="h-3 w-3" />}
      >
        <Input
          type="number"
          value={product.importPrice || 0}
          onChange={(v) =>
            update("importPrice", Number(v))
          }
        />
      </Field>

      {/* SELLING PRICE */}
      <Field
        label={dict.sellingPrice}
        icon={<DollarSign className="h-3 w-3" />}
      >
        <Input
          type="number"
          value={product.sellingPrice || 0}
          onChange={(v) =>
            update("sellingPrice", Number(v))
          }
        />
      </Field>

      {/* REORDER THRESHOLD */}
      <Field
        label={dict.reorderThreshold}
        icon={<AlertTriangle className="h-3 w-3" />}
      >
        <Input
          type="number"
          value={product.reorderThreshold || 0}
          onChange={(v) =>
            update("reorderThreshold", Number(v))
          }
        />
      </Field>

      {/* DESCRIPTION */}
      <Field
        label={dict.description}
        icon={<Ruler className="h-3 w-3" />} // or change icon if you want
      >
        <Textarea
          value={product.productDescription || ""}
          onChange={(v) => update("description", v)}
          placeholder={dict.descriptionPlaceholder}
        />
      </Field>

    </div>
  );
}

/* ───────────────── Helpers ───────────────── */

function getStockStatus(
  product: Product,
  dict: Dictionary
): { label: string; accent: Accent } {
  if (!product) {
    return { label: "", accent: "neutral" };
  }

  if (product.inventoryStock <= 0) {
    return { label: dict.outOfStock, accent: "danger" };
  }

  if (product.inventoryStock <= product.reorderThreshold) {
    return { label: dict.lowStock, accent: "warning" };
  }

  return { label: dict.inStock, accent: "success" };
}