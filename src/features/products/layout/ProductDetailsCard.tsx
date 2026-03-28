"use client";

import {
  AlertTriangle,
  Barcode,
  DollarSign,
  Edit2,
  Ruler,
  Warehouse,
} from "lucide-react";

import { Accent } from "@/components/types/ui";
import {
  Field,
  Input,
  SelectButton,
  StatDisplay,
  Textarea,
} from "@/components/ui/Fields";
import { Dictionary } from "@/lib/lang/i18n";
import { useState } from "react";
import { Product } from "../types/product";
import UnitPickerPopup from "./UnitPickerPopup";

type Props = {
  product: Product;
  update: (k: any, v: any) => void;
  dict: Dictionary;
  disabled?: boolean;
  errors?: Partial<Record<keyof Product, string>>;
};

export default function ProductDetailsCard({
  product,
  update,
  dict,
  disabled,
  errors = {},
}: Props) {
  const stock = getStockStatus(product, dict);
  const [unitOpen, setUnitOpen] = useState(false);

  const isDisabled = disabled || !product.isActive;
  const MAX_INT = 2147483647;

  return (
    <div className="card p-5 space-y-4 rounded-lg">
      <span className="flex items-center text-sm font-semibold text-text gap-2">
        <Edit2 className="w-3 h-3" />
        {dict.productDetails}
      </span>

      {/* SKU */}
      <Field
        label={dict.sku}
        icon={<Barcode className="h-3 w-3" />}
        error={errors.sku}
      >
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
      <Field
        label={dict.unit}
        icon={<Ruler className="h-3 w-3" />}
        error={errors.productUnitId}
      >
        <SelectButton
          value={product.productUnitName}
          placeholder={dict.selectUnit}
          disabled={isDisabled}
          onClick={() => setUnitOpen(true)}
        />
      </Field>

      <UnitPickerPopup
        open={unitOpen}
        selectedUnitId={product.productUnitId}
        onClose={() => setUnitOpen(false)}
        onSelect={(unit) => {
          update("productUnitId", unit.id);
          update("productUnitName", unit.unitName);
        }}
      />

      {/* IMPORT PRICE */}
      <Field
        label={dict.importPrice}
        icon={<DollarSign className="h-3 w-3" />}
        error={errors.importPrice}
      >
        <Input
          type="number"
          value={product.importPrice || 0}
          disabled={isDisabled}
          onChange={(v) => {
            if (v === "") return update("importPrice", 0);

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
        error={errors.sellingPrice}
      >
        <Input
          type="number"
          value={product.sellingPrice || 0}
          disabled={isDisabled}
          onChange={(v) => {
            if (v === "") return update("sellingPrice", 0);

            const num = Number(v);

            // invalid number
            if (isNaN(num)) return;

            // exceed max
            if (num > MAX_INT) return;

            // more than 2 decimal places
            const decimalPart = v.split(".")[1];
            if (decimalPart && decimalPart.length > 2) return;

            update("sellingPrice", num);
          }}
        />
      </Field>

      {/* REORDER THRESHOLD */}
      <Field
        label={dict.reorderThreshold}
        icon={<AlertTriangle className="h-3 w-3" />}
        error={errors.reorderThreshold}
      >
        <Input
          type="number"
          disabled={isDisabled}
          value={product.reorderThreshold || 0}
          onChange={(v) => {
            if (v === "") return update("reorderThreshold", 0);

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
        icon={<Ruler className="h-3 w-3" />}
        error={errors.productDescription}
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