import type { Product } from "@/features/products/types/product";
import type { Dictionary } from "@/lib/lang/i18n";
import {
  getSkuBaseFieldError,
  getSkuCheckingHint,
  isSku13Format,
  isSkuInputEmpty,
  normalizeSkuInput,
  SKU_13_DIGIT_PATTERN,
} from "@/lib/sku/skuInputValidation";

import type { SkuValidationContext } from "../types/invoiceLineEntryTypes";

export const INVOICE_SKU_13_DIGIT_PATTERN = SKU_13_DIGIT_PATTERN;

export type InvoiceSkuLookupState = {
  sku: string;
  skuDebouncing: boolean;
  skuChecking: boolean;
  skuNotFound: boolean;
  resolvedProduct: Product | null;
  excludedProductIds: Set<string>;
};

export {
  isSku13Format as isInvoiceSku13Format,
  isSkuInputEmpty as isInvoiceSkuInputEmpty,
  normalizeSkuInput as normalizeInvoiceSkuInput,
};

/**
 * Builds the validation context passed to optional variant-specific SKU rules.
 *
 * @param state - Current SKU lookup state from {@link useSkuCheck}.
 * @returns Context for {@link InvoiceLineEntryVariantConfig.getSkuError}.
 */
export function buildInvoiceSkuValidationContext(
  state: InvoiceSkuLookupState,
): SkuValidationContext {
  return {
    sku: state.sku,
    skuDebouncing: state.skuDebouncing,
    skuChecking: state.skuChecking,
    skuNotFound: state.skuNotFound,
    resolvedProduct: state.resolvedProduct,
    excludedProductIds: state.excludedProductIds,
  };
}

/**
 * Returns the first SKU field error for invoice add flows, or an empty string when valid.
 *
 * @param value - SKU digits currently in the input.
 * @param state - Debounce, lookup, and exclusion state.
 * @param dict - Localized validation messages.
 * @param getExtraSkuError - Optional variant-specific rule (e.g. selling import rules).
 * @returns Error message to show on the SKU field, or "" when none.
 */
export function getInvoiceSkuFieldError(
  value: string,
  state: InvoiceSkuLookupState,
  dict: Dictionary,
  getExtraSkuError?: (ctx: SkuValidationContext) => string,
): string {
  const baseError = getSkuBaseFieldError(
    value,
    {
      skuDebouncing: state.skuDebouncing,
      skuChecking: state.skuChecking,
    },
    dict,
  );

  if (baseError) {
    return baseError;
  }

  if (isSkuInputEmpty(value) || !isSku13Format(value)) {
    return "";
  }

  if (state.skuNotFound) {
    return dict.skuProductNotFound;
  }

  if (state.resolvedProduct && !state.resolvedProduct.isActive) {
    return dict.productInactiveCannotAdd;
  }

  if (
    state.resolvedProduct &&
    state.excludedProductIds.has(state.resolvedProduct.id)
  ) {
    return dict.productAlreadyOnInvoice;
  }

  if (getExtraSkuError) {
    return getExtraSkuError(buildInvoiceSkuValidationContext(state));
  }

  return "";
}

/**
 * @param state - Current SKU lookup state.
 * @returns True when lookup finished and the product can be added to the invoice.
 */
export function isInvoiceSkuResolved(state: InvoiceSkuLookupState): boolean {
  const { sku, skuDebouncing, skuChecking, resolvedProduct, excludedProductIds } =
    state;

  return (
    isSku13Format(sku) &&
    !skuDebouncing &&
    !skuChecking &&
    resolvedProduct !== null &&
    resolvedProduct.isActive &&
    !excludedProductIds.has(resolvedProduct.id)
  );
}

/**
 * @param value - SKU digits in the input.
 * @param state - Current SKU lookup state.
 * @param dict - Localized validation messages.
 * @param getExtraSkuError - Optional variant-specific SKU rule.
 * @returns True when the SKU field has no errors and the product is addable.
 */
export function isInvoiceSkuValidated(
  value: string,
  state: InvoiceSkuLookupState,
  dict: Dictionary,
  getExtraSkuError?: (ctx: SkuValidationContext) => string,
): boolean {
  return (
    isInvoiceSkuResolved(state) &&
    getInvoiceSkuFieldError(value, state, dict, getExtraSkuError) === ""
  );
}

/**
 * @param sku - Current SKU input value.
 * @param touched - Whether the user has blurred the SKU field.
 * @param getSkuFieldError - Bound error resolver for the current lookup state.
 * @returns Error string for the UI, or "" before first interaction on an empty field.
 */
export function getInvoiceSkuDisplayError(
  sku: string,
  touched: boolean,
  getSkuFieldError: (value: string) => string,
): string {
  if (!touched && sku.length === 0) {
    return "";
  }

  return getSkuFieldError(sku);
}

/**
 * @param skuDebouncing - Whether the debounced SKU differs from the raw input.
 * @param skuChecking - Whether a lookup request is in flight.
 * @param dict - Localized strings.
 * @returns Hint while lookup is pending, or undefined when idle.
 */
export function getInvoiceSkuCheckingHint(
  skuDebouncing: boolean,
  skuChecking: boolean,
  dict: Dictionary,
): string | undefined {
  return getSkuCheckingHint(skuDebouncing, skuChecking, dict.checkingSku);
}
