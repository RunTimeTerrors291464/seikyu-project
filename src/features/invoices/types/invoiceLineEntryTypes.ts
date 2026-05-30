import type { Product } from "@/features/products/types/product";
import type { ReactNode } from "react";

export type InvoiceLineEntryVariantId = "selling" | "import" | "stockAdjustment";

/**
 * Shared draft fields resolved from SKU lookup and user input on every invoice line entry card.
 */
export type InvoiceLineEntrySharedState = {
  sku: string;
  quantity: string;
  notes: string;
  product: Product | null;
  productName: string;
  productUnit: string;
  skuValidated: boolean;
  skuError: string;
  skuHint: string | undefined;
  touched: boolean;
};

export type InvoiceLineEntryContext<TVariantFields> =
  InvoiceLineEntrySharedState & {
    variantFields: TVariantFields;
    lineFieldValidationActive: boolean;
    /** Set after Enter/commit when required variant fields fail validation. */
    lineCommitAttempted: boolean;
    clearLineCommitAttempt: () => void;
    setQuantity: (value: string) => void;
    setNotes: (value: string) => void;
    setVariantField: <K extends keyof TVariantFields>(
      key: K,
      value: TVariantFields[K],
    ) => void;
  };

export type SkuValidationContext = {
  sku: string;
  skuDebouncing: boolean;
  skuChecking: boolean;
  skuNotFound: boolean;
  resolvedProduct: Product | null;
  excludedProductIds: Set<string>;
};

/**
 * Variant-specific configuration for {@link InvoiceProductLineEntryCard}.
 *
 * @typeParam TLine - Invoice line row type appended to the products table.
 * @typeParam TVariantFields - Variant-only form state (e.g. discount, import price).
 */
export type InvoiceLineEntryVariantConfig<TLine, TVariantFields> = {
  variantId: InvoiceLineEntryVariantId;
  getDefaultVariantFields: () => TVariantFields;
  /** Called when SKU lookup resolves a product (add mode) to seed variant fields. */
  hydrateVariantFieldsFromProduct?: (product: Product) => TVariantFields;
  getSkuError?: (ctx: SkuValidationContext) => string;
  canAddLine: (ctx: InvoiceLineEntryContext<TVariantFields>) => boolean;
  /** When true, a commit attempt should surface variant-field validation in column 3. */
  isVariantFieldsInvalidForCommit?: (
    ctx: InvoiceLineEntryContext<TVariantFields>,
  ) => boolean;
  buildLine: (
    product: Product,
    ctx: InvoiceLineEntryContext<TVariantFields>,
  ) => TLine;
  /** Loads the entry card from an existing table row (SKU locked). */
  parseLineForEdit?: (line: TLine) => {
    sku: string;
    quantity: string;
    notes: string;
    variantFields: TVariantFields;
    product: Product;
  };
  /** Builds an updated row while preserving line identity (`localId`, etc.). */
  buildLineForUpdate?: (
    sourceLine: TLine,
    ctx: InvoiceLineEntryContext<TVariantFields>,
  ) => TLine | null;
  computeLineTotal?: (ctx: InvoiceLineEntryContext<TVariantFields>) => number;
  renderColumn3: (ctx: InvoiceLineEntryContext<TVariantFields>) => ReactNode;
  renderColumn4: (ctx: InvoiceLineEntryContext<TVariantFields>) => ReactNode;
};
