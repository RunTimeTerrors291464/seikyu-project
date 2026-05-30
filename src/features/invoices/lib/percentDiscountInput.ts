import {
  finalizeMoneyStringTwoDecimalPlaces,
  normalizeMoneyStringInput,
} from "@/lib/numeric/integerAndMoneyInputs";
import { toNumberOrZero } from "../types/importInvoiceDetail";

export const MAX_PERCENT_DISCOUNT = 100;

/**
 * Clamps a percent discount to 0–100.
 *
 * @param value - Raw numeric discount.
 * @returns Value within {@link MAX_PERCENT_DISCOUNT}.
 */
export function clampPercentDiscount(value: number): number {
  return Math.min(Math.max(value, 0), MAX_PERCENT_DISCOUNT);
}

/**
 * Normalizes user input for a percent discount field while typing.
 *
 * @param raw - Raw input string.
 * @returns Normalized discount string.
 */
export function normalizePercentDiscountInput(raw: string): string {
  const normalized = normalizeMoneyStringInput(raw, { allowEmpty: true });
  if (normalized === "") {
    return "";
  }
  const numeric = clampPercentDiscount(toNumberOrZero(normalized));
  return normalized.endsWith(".") ? `${numeric}.` : String(numeric);
}

/**
 * Finalizes a percent discount on blur to two decimal places.
 *
 * @param raw - Raw input string.
 * @returns Fixed discount string.
 */
export function finalizePercentDiscountInput(raw: string): string {
  const finalized = finalizeMoneyStringTwoDecimalPlaces(raw, {
    allowEmpty: false,
  });
  return clampPercentDiscount(toNumberOrZero(finalized)).toFixed(2);
}
