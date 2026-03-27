"use client";

import { Field, Input, SelectButton, Textarea } from "@/components/ui/Fields";
import { Dictionary } from "@/lib/lang/i18n";
import UnitPickerPopup from "@features/products/layout/UnitPickerPopup";
import { AlertTriangle, Barcode, DollarSign, Ruler } from "lucide-react";
import { useState } from "react";

export type CreateProductFormData = {
  sku: string;
  name: string;
  productUnitId: string;
  productUnitName: string;
  importPrice: number;
  sellingPrice: number;
  reorderThreshold: number;
  productDescription: string;
};

type Props = {
  dict: Dictionary;
  onChange?: (data: CreateProductFormData, valid: boolean) => void;
};

export default function AddProductForm({ dict, onChange }: Props) {

  const [data, setData] = useState<CreateProductFormData>({
    sku: "",
    name: "",
    productUnitId: "",
    productUnitName: "",
    importPrice: 0,
    sellingPrice: 0,
    reorderThreshold: 0,
    productDescription: "",
  });

  const [unitOpen, setUnitOpen] = useState(false);

  const MAX_INT = 2147483647;

  /* ───────── UPDATE ───────── */

  function update<K extends keyof CreateProductFormData>(
    key: K,
    value: CreateProductFormData[K]
  ) {
    const next = { ...data, [key]: value };
    setData(next);

    const valid =
      next.sku.length === 13 &&
      next.name.trim().length > 0 &&
      !!next.productUnitId &&
      next.importPrice >= 0 &&
      next.sellingPrice >= 0;

    onChange?.(next, valid);
  }

  /* ───────── UI ───────── */

  return (
    <div className="space-y-4">

      {/* SKU */}
      <Field label={dict.sku} icon={<Barcode className="h-3 w-3" />} required>
        <Input
          value={data.sku}
          onChange={(v) => {
            const digits = v.replace(/\D/g, "");
            update("sku", digits.slice(0, 13));
          }}
          onBlur={() => {
            if (data.sku) update("sku", data.sku.padStart(13, "0"));
          }}
          inputMode="numeric"
          maxLength={13}
        />
      </Field>

      {/* NAME */}
      <Field label={dict.productName} required>
        <Input
          value={data.name}
          onChange={(v) => update("name", v)}
        />
      </Field>

      {/* UNIT */}
      <Field label={dict.unit} icon={<Ruler className="h-3 w-3" />} required>
        <SelectButton
          value={data.productUnitName}
          placeholder={dict.selectUnit}
          onClick={() => setUnitOpen(true)}
        />
      </Field>

      <UnitPickerPopup
        open={unitOpen}
        onClose={() => setUnitOpen(false)}
        selectedUnitId={data.productUnitId}
        onSelect={(unit) => {
          update("productUnitId", unit.id);
          update("productUnitName", unit.unitName);
        }}
      />

      {/* IMPORT PRICE */}
      <Field label={dict.importPrice} icon={<DollarSign className="h-3 w-3" />}>
        <Input
          type="number"
          value={data.importPrice}
          onChange={(v) => {
            const num = Number(v);
            if (isNaN(num) || num > MAX_INT) return;

            const decimal = v.split(".")[1];
            if (decimal && decimal.length > 2) return;

            update("importPrice", num);
          }}
        />
      </Field>

      {/* SELLING PRICE */}
      <Field label={dict.sellingPrice} icon={<DollarSign className="h-3 w-3" />}>
        <Input
          type="number"
          value={data.sellingPrice}
          onChange={(v) => {
            const num = Number(v);
            if (isNaN(num) || num > MAX_INT) return;

            const decimal = v.split(".")[1];
            if (decimal && decimal.length > 2) return;

            update("sellingPrice", num);
          }}
        />
      </Field>

      {/* REORDER */}
      <Field label={dict.reorderThreshold} icon={<AlertTriangle className="h-3 w-3" />}>
        <Input
          type="number"
          value={data.reorderThreshold}
          onChange={(v) => {
            const num = Number(v);
            if (!Number.isInteger(num) || num > MAX_INT) return;
            update("reorderThreshold", num);
          }}
        />
      </Field>

      {/* DESCRIPTION */}
      <Field label={dict.description}>
        <Textarea
          value={data.productDescription}
          onChange={(v) => update("productDescription", v)}
          placeholder={dict.descriptionPlaceholder}
        />
      </Field>

    </div>
  );
}