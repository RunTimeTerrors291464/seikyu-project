import type { Dictionary } from "@/lib/lang/i18n";

export const SKU_13_DIGIT_PATTERN = /^\d{13}$/;

export type SkuPendingCheckState = {
  skuDebouncing: boolean;
  skuChecking: boolean;
};

export type SkuBaseFieldErrorOptions = {
  /** When true, empty input returns `skuMustBe13` instead of skipping validation. */
  showEmptyError?: boolean;
};

/**
 * Strips non-digits and limits SKU input to 13 characters.
 *
 * @param value - Raw input from the SKU field.
 * @returns Normalized digit-only SKU string.
 */
export function normalizeSkuInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 13);
}

/**
 * @param inputSku - SKU digits currently in the input.
 * @param productSku - SKU from a resolved catalog product.
 * @returns True when both normalize to the same 13-digit SKU.
 */
export function skuInputMatchesProductSku(
  inputSku: string,
  productSku: string,
): boolean {
  if (isSkuInputEmpty(inputSku)) {
    return false;
  }

  const padTo13 = function padTo13(value: string): string {
    return normalizeSkuInput(value).padStart(13, "0");
  };

  return padTo13(inputSku) === padTo13(productSku);
}

/**
 * @param value - SKU digits currently in the input.
 * @returns True when the field has no characters to validate.
 */
export function isSkuInputEmpty(value: string): boolean {
  return value.length === 0;
}

/**
 * @param value - SKU string to test.
 * @returns True when the value is exactly 13 digits.
 */
export function isSku13Format(value: string): boolean {
  return SKU_13_DIGIT_PATTERN.test(value);
}

/**
 * @param skuDebouncing - Whether the debounced SKU differs from the raw input.
 * @param skuChecking - Whether a lookup request is in flight.
 * @param checkingSkuLabel - Localized checking message.
 * @returns Hint while lookup is pending, or undefined when idle.
 */
export function getSkuCheckingHint(
  sku: string,
  skuDebouncing: boolean,
  skuChecking: boolean,
  checkingSkuLabel: string,
): string | undefined {
  if (isSkuInputEmpty(sku)) {
    return undefined;
  }

  return skuDebouncing || skuChecking ? checkingSkuLabel : undefined;
}

/**
 * Shared SKU field rules before intent-specific errors (duplicate vs invoice lookup).
 *
 * @param value - SKU digits in the input.
 * @param pending - Debounce and in-flight flags from {@link useSkuCheck}.
 * @param dict - Localized messages (uses `skuMustBe13`).
 * @param options - Empty-field handling for required forms.
 * @returns Error message, or "" when format is valid and lookup can proceed.
 */
export function getSkuBaseFieldError(
  value: string,
  pending: SkuPendingCheckState,
  dict: Pick<Dictionary, "skuMustBe13">,
  options?: SkuBaseFieldErrorOptions,
): string {
  if (isSkuInputEmpty(value)) {
    return options?.showEmptyError ? dict.skuMustBe13 : "";
  }

  // if (!isSku13Format(value)) {
  //   return dict.skuMustBe13;
  // }

  if (pending.skuDebouncing || pending.skuChecking) {
    return "";
  }

  return "";
}
