import type { Dictionary } from "@/lib/lang/i18n";
import { getSkuBaseFieldError } from "@/lib/sku/skuInputValidation";

export type ProductSkuDuplicateCheckState = {
  skuDebouncing: boolean;
  skuChecking: boolean;
  skuDuplicate: boolean;
};

type ProductCreateSkuFieldErrorOptions = {
  /** When true, empty input returns `skuMustBe13` (e.g. submit or blurred field). */
  showEmptyError?: boolean;
};

/**
 * SKU field errors for new/edit product forms (`useSkuCheck` with `checkDuplicate`).
 *
 * @param value - SKU digits in the input.
 * @param state - Debounce and duplicate-check flags from the SKU hook.
 * @param dict - Localized validation messages.
 * @param options - When `showEmptyError` is false, an empty field skips format and API rules.
 * @returns Error message for the SKU field, or "" when valid.
 */
export function getProductCreateSkuFieldError(
  value: string,
  state: ProductSkuDuplicateCheckState,
  dict: Dictionary,
  options?: ProductCreateSkuFieldErrorOptions,
): string {
  const baseError = getSkuBaseFieldError(
    value,
    {
      skuDebouncing: state.skuDebouncing,
      skuChecking: state.skuChecking,
    },
    dict,
    options,
  );

  if (baseError) {
    return baseError;
  }

  if (state.skuDuplicate) {
    return dict.skuAlreadyExists;
  }

  return "";
}
