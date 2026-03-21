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
  disabled?: boolean;
};


export default function ProductDetailsCard({
  product,
  update,
  dict,
  disabled,
}: Props) {

  const stock = getStockStatus(product, dict);
  const isDisabled = disabled || !product.isActive;
  const MAX_INT = 2147483647;
  return (
    <div className="card p-5 space-y-4 rounded-lg">

      <h2 className="text-sm font-semibold text-text">
        {dict.productDetails}
      </h2>

      {/* SKU */}
      <Field label={dict.sku} icon={<Barcode className="h-3 w-3" />}>
        <Input
          value={product.sku || ""}
          disabled={isDisabled}
          onChange={(v) => {
            const digits = v.replace(/\D/g, "");
            update("sku", digits.slice(0, 13));
          }}
          onBlur={() => {
            const sku = String(product.sku || "");
            if (sku) update("sku", sku.padStart(13, "0"));
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text");
            const digits = text.replace(/\D/g, "").slice(0, 13);
            update("sku", digits);
          }}
          inputMode="numeric"
          maxLength={13}
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
          onChange={(v) => update("productUnitId", v)}
          disabled={isDisabled}
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
          disabled={isDisabled}
          onChange={(v) => {
            if (v === "") {
              update("importPrice", 0);
              return;
            }

            const num = Number(v);

            // invalid number
            if (isNaN(num)) return;

            // exceed max
            if (num > MAX_INT) return;

            // more than 2 decimal places
            const decimalPart = v.split(".")[1];
            if (decimalPart && decimalPart.length > 2) return;

            update("importPrice", num);
          }}
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
          disabled={isDisabled}
          onChange={(v) => {
            if (v === "") {
              update("importPrice", 0);
              return;
            }

            const num = Number(v);

            // invalid number
            if (isNaN(num)) return;

            // exceed max
            if (num > MAX_INT) return;

            // more than 2 decimal places
            const decimalPart = v.split(".")[1];
            if (decimalPart && decimalPart.length > 2) return;

            update("importPrice", num);
          }}
        />
      </Field>

      {/* REORDER THRESHOLD */}
      <Field
        label={dict.reorderThreshold}
        icon={<AlertTriangle className="h-3 w-3" />}
      >
        <Input
          type="number"
          disabled={isDisabled}
          value={product.reorderThreshold || 0}
          onChange={(v) => {
            if (v === "") {
              update("reorderThreshold", 0);
              return;
            }

            const num = Number(v);

            // invalid
            if (isNaN(num)) return;

            // decimal not allowed
            if (!Number.isInteger(num)) return;

            // exceed max
            if (num > MAX_INT) return;

            update("reorderThreshold", num);
          }}
        />
      </Field>

      {/* DESCRIPTION */}
      <Field
        label={dict.description}
        icon={<Ruler className="h-3 w-3" />} // or change icon if you want
      >
        <Textarea
          disabled={isDisabled}
          value={product.productDescription || ""}
          onChange={(v) => update("productDescription", v)}
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