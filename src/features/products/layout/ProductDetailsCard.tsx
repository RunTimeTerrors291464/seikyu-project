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
import {
  finalizeMoneyStringTwoDecimalPlaces,
  normalizeIntegerStringInput,
  normalizeMoneyStringInput,
  normalizedIntegerStringToNumber,
  normalizedMoneyStringToNumber,
} from "@/lib/numeric/integerAndMoneyInputs";
import { useCallback, useEffect, useState } from "react";
import { useProductUnitActiveState } from "../hooks/useProductUnitActiveState";
import useSkuValidation from "../hooks/useSkuValidation";
import { Product } from "../types/product";
import UnitPickerPopup from "./UnitPickerPopup";

/**
 * Holds the last saved reorder threshold for stock accent/label only.
 *
 * Updates when the product row is loaded or refreshed from the server
 * (`id` / `updatedAt`), not when the user edits the reorder field locally.
 *
 * @param product - Current product from the detail form.
 * @returns Reorder threshold to use when comparing against `inventoryStock`.
 */
function useReorderThresholdBaseline(product: Product): number {
  const [baseline, setBaseline] = useState(
    () => product.reorderThreshold ?? 0
  );

  useEffect(() => {
    setBaseline(product.reorderThreshold ?? 0);
  }, [product.id, product.updatedAt]);

  return baseline;
}

type Props = {
  product: Product;
  update: <K extends keyof Product>(key: K, value: Product[K]) => void;
  dict: Dictionary;
  disabled?: boolean;
  errors?: Partial<Record<keyof Product, string>>;

  onSkuStateChange?: (state: {
    debouncing: boolean;
    checking: boolean;
    duplicate: boolean;
  }) => void;
};

export default function ProductDetailsCard({
  product,
  update,
  dict,
  disabled,
  errors = {},
  onSkuStateChange,
}: Props) {
  const reorderThresholdBaseline = useReorderThresholdBaseline(product);
  const stock = getStockStatus(product, dict, reorderThresholdBaseline);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitServerNonce, setUnitServerNonce] = useState(0);

  const [importPriceText, setImportPriceText] = useState(() =>
    moneyDraftFromProductNumber(product.importPrice),
  );
  const [sellingPriceText, setSellingPriceText] = useState(() =>
    moneyDraftFromProductNumber(product.sellingPrice),
  );

  useEffect(() => {
    setImportPriceText(moneyDraftFromProductNumber(product.importPrice));
  }, [product.id, product.updatedAt]);

  useEffect(() => {
    setSellingPriceText(moneyDraftFromProductNumber(product.sellingPrice));
  }, [product.id, product.updatedAt]);

  const isDisabled = disabled || !product.isActive;

  const [initialSku] = useState(product.sku || "");

  const {
    checking: skuChecking,
    isDebouncing: skuDebouncing,
    isDuplicate: skuDuplicate,
  } =
    useSkuValidation({
      sku: product.sku || "",
      skip: (product.sku || "") === initialSku,
    });

  const skuValue = String(product.sku || "");
  const hasValidSkuFormat = /^\d{13}$/.test(skuValue);

  const bumpUnitServerState = useCallback(function bumpUnitServerState(): void {
    setUnitServerNonce((n) => n + 1);
  }, []);

  const unitActiveOnServer = useProductUnitActiveState(
    product.productUnitId,
    product.productUnitName,
    product.updatedAt,
    unitServerNonce
  );

  const unitFieldError =
    errors.productUnitId ??
    (!product.productUnitId?.trim() ? dict.unitRequired : undefined) ??
    (unitActiveOnServer === false ? dict.selectedUnitInactive : undefined);

  const skuError =
    errors.sku ||
    (!hasValidSkuFormat
      ? dict.skuMustBe13
      : skuDebouncing || skuChecking
        ? undefined
        : skuDuplicate
          ? dict.skuAlreadyExists
          : undefined);

  useEffect(() => {
    onSkuStateChange?.({
      debouncing: skuDebouncing,
      checking: skuChecking,
      duplicate: skuDuplicate,
    });
  }, [skuDebouncing, skuChecking, skuDuplicate, onSkuStateChange]);

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
        error={skuError}
        hint={
          skuDebouncing || skuChecking
            ? dict.checkingSku
            : undefined
        }
      >
        <Input
          value={product.sku || ""}
          disabled={isDisabled}
          onChange={(v) => {
            const digits = v.replace(/\D/g, "");

            update("sku", digits.slice(0, 13));
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
        error={unitFieldError}
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
        onClearSelection={() => {
          update("productUnitId", "");
          update("productUnitName", "");
        }}
        onUnitServerStateChanged={bumpUnitServerState}
      />

      {/* IMPORT PRICE */}
      <Field
        label={dict.importPrice}
        icon={<DollarSign className="h-3 w-3" />}
        error={errors.importPrice}
      >
        <Input
          value={importPriceText}
          disabled={isDisabled}
          onChange={(v) => {
            const normalized = normalizeMoneyStringInput(v, {
              allowEmpty: false,
            });
            setImportPriceText(normalized);
            const num = normalizedMoneyStringToNumber(normalized);
            if (num === null) {
              return;
            }
            update("importPrice", num);
          }}
          onBlur={() => {
            const finalized = finalizeMoneyStringTwoDecimalPlaces(
              importPriceText,
              { allowEmpty: false },
            );
            setImportPriceText(finalized);
            const num = normalizedMoneyStringToNumber(finalized);
            if (num !== null) {
              update("importPrice", num);
            }
          }}
          inputMode="decimal"
        />
      </Field>

      {/* SELLING PRICE */}
      <Field
        label={dict.sellingPrice}
        icon={<DollarSign className="h-3 w-3" />}
        error={errors.sellingPrice}
      >
        <Input
          value={sellingPriceText}
          disabled={isDisabled}
          onChange={(v) => {
            const normalized = normalizeMoneyStringInput(v, {
              allowEmpty: false,
            });
            setSellingPriceText(normalized);
            const num = normalizedMoneyStringToNumber(normalized);
            if (num === null) {
              return;
            }
            update("sellingPrice", num);
          }}
          onBlur={() => {
            const finalized = finalizeMoneyStringTwoDecimalPlaces(
              sellingPriceText,
              { allowEmpty: false },
            );
            setSellingPriceText(finalized);
            const num = normalizedMoneyStringToNumber(finalized);
            if (num !== null) {
              update("sellingPrice", num);
            }
          }}
          inputMode="decimal"
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
            const normalized = normalizeIntegerStringInput(v, {
              allowEmpty: false,
            });
            const num = normalizedIntegerStringToNumber(normalized);
            if (num === null) {
              return;
            }
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
          placeholder={dict.productDescriptionPlaceholder}
        />
      </Field>
    </div>
  );
}

/* ───────────────── Helpers ───────────────── */

/**
 * Builds a two-decimal draft string for product price fields from the stored number.
 *
 * @param value - Current `importPrice` / `sellingPrice` from product state.
 * @returns Dot-decimal string with exactly two fractional digits.
 */
function moneyDraftFromProductNumber(value: number | undefined): string {
  return finalizeMoneyStringTwoDecimalPlaces(String(value ?? 0), {
    allowEmpty: false,
  });
}

/**
 * Derives stock label and accent from inventory and a stable reorder threshold.
 *
 * @param product - Product row (uses `inventoryStock`).
 * @param dict - Copy for out/low/in stock labels.
 * @param reorderThresholdForComparison - Threshold for low-stock (not draft edits).
 * @returns Display label and accent for the current stock stat.
 */
function getStockStatus(
  product: Product,
  dict: Dictionary,
  reorderThresholdForComparison: number
): { label: string; accent: Accent } {
  if (!product) {
    return { label: "", accent: "neutral" };
  }

  if (product.inventoryStock <= 0) {
    return { label: dict.outOfStock, accent: "danger" };
  }

  if (product.inventoryStock <= reorderThresholdForComparison) {
    return { label: dict.lowStock, accent: "warning" };
  }

  return { label: dict.inStock, accent: "success" };
}