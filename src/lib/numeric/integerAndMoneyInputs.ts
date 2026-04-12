/**
 * Shared limits and normalizers for money and integer inputs (product details, invoice lines).
 */

export const MAX_INTEGER_INPUT = 2147483647;

/**
 * Locale-aware options for showing monetary amounts with exactly two fractional digits.
 */
export const PRICE_DISPLAY_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/**
 * Formats a numeric amount for read-only UI (tables, KPIs) with two decimal places.
 *
 * @param value - Finite amount, or null/undefined (treated as 0) when the API omits a price.
 * @returns Locale-formatted string with two fractional digits.
 */
export function formatPriceNumber(value: number | null | undefined): string {
  const numeric =
    value == null || !Number.isFinite(Number(value)) ? 0 : Number(value);
  return numeric.toLocaleString(undefined, PRICE_DISPLAY_FORMAT);
}

/**
 * Formats a money-like string or number for read-only display with two decimal places.
 *
 * @param value - Amount from API or draft row (may include comma separators).
 * @returns Locale-formatted string with two fractional digits.
 */
export function formatPriceMoneyLike(value: string | number): string {
  const numeric =
    typeof value === "number" ? value : parseMoneyLikeString(String(value));
  return formatPriceNumber(numeric);
}

/**
 * Normalizes a money input to exactly two fractional digits (dot decimal) after blur,
 * for stable display in controlled fields. Clamps to {@link MAX_INTEGER_INPUT}.
 *
 * @param raw - Current input text.
 * @param options.allowEmpty - When true, blank input stays `""`. When false, blank is treated as zero.
 * @returns String with pattern `^\d+\.\d{2}$`, or `""` when allowed.
 */
export function finalizeMoneyStringTwoDecimalPlaces(
  raw: string,
  options: { allowEmpty: boolean },
): string {
  const trimmed = raw.trim();
  if (options.allowEmpty && trimmed === "") {
    return "";
  }

  const normalized = normalizeMoneyStringInput(trimmed === "" ? "" : trimmed, {
    allowEmpty: false,
  });
  const withoutTrailingDot = normalized.endsWith(".")
    ? normalized.slice(0, -1)
    : normalized;
  const parsed = parseMoneyLikeString(withoutTrailingDot);
  const clamped = Math.min(Math.max(parsed, 0), MAX_INTEGER_INPUT);
  return clamped.toFixed(2);
}

/**
 * Parses a numeric money string that may include thousands separators (commas), as returned by APIs or `toLocaleString`.
 *
 * @param raw - Raw string (or value coerced to string) for a unit price or quantity field.
 * @returns A finite number, or 0 when empty or unparsable.
 */
export function parseMoneyLikeString(raw: string | number): number {
  const stripped = String(raw).replace(/,/g, "").trim();
  if (stripped === "") {
    return 0;
  }
  const parsed = Number(stripped);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Computes line total as quantity × unit price, with comma-safe parsing for formatted strings.
 *
 * @param quantity - Quantity as entered or from API (string).
 * @param unitPrice - Unit price string (may contain commas).
 * @returns The product, or 0 when inputs are invalid.
 */
export function lineTotalFromQuantityAndMoneyStrings(
  quantity: string,
  unitPrice: string,
): number {
  return parseMoneyLikeString(quantity) * parseMoneyLikeString(unitPrice);
}

/**
 * Normalizes a money-like decimal input: digits, one decimal point, at most two fractional digits,
 * value clamped to {@link MAX_INTEGER_INPUT}.
 *
 * @param raw - Raw input from a text or number field.
 * @param options.allowEmpty - When true, empty input becomes `""`. When false, empty becomes `"0"`.
 * @returns A string safe to store in draft invoice rows or to parse as a number for product state.
 */
export function normalizeMoneyStringInput(
  raw: string,
  options: { allowEmpty: boolean },
): string {
  const allowEmpty = options.allowEmpty;

  if (allowEmpty && raw === "") {
    return "";
  }

  if (!allowEmpty && raw === "") {
    return "0";
  }

  let integerPart = "";
  let decimalPart = "";
  let sawDot = false;

  for (const character of raw) {
    if (character >= "0" && character <= "9") {
      if (!sawDot) {
        integerPart += character;
      } else if (decimalPart.length < 2) {
        decimalPart += character;
      }
    } else if (character === "." && !sawDot) {
      sawDot = true;
    }
  }

  let intTrimmed = integerPart.replace(/^0+(?=\d)/, "");
  if (intTrimmed === "") {
    intTrimmed = "0";
  }

  let intValue = Number(intTrimmed);
  if (!Number.isFinite(intValue)) {
    return allowEmpty ? "" : "0";
  }

  if (intValue > MAX_INTEGER_INPUT) {
    intTrimmed = String(MAX_INTEGER_INPUT);
    intValue = MAX_INTEGER_INPUT;
  }

  const hasTrailingDot =
    raw.includes(".") && decimalPart === "" && sawDot;

  if (hasTrailingDot) {
    return `${intTrimmed}.`;
  }

  if (decimalPart.length > 0) {
    const combined = Number(`${intTrimmed}.${decimalPart}`);
    if (!Number.isFinite(combined)) {
      return allowEmpty ? "" : "0";
    }
    const clamped = Math.min(Math.max(combined, 0), MAX_INTEGER_INPUT);
    return String(clamped);
  }

  return intTrimmed;
}

/**
 * Converts a normalized money string from {@link normalizeMoneyStringInput} to a number for product state.
 * Trailing dot (e.g. `"1."`) maps to the integer part only.
 *
 * @param normalized - Output from `normalizeMoneyStringInput` with `allowEmpty: false`.
 * @returns A finite number within range, or `null` if the string cannot be applied (should not happen for normalized input).
 */
export function normalizedMoneyStringToNumber(normalized: string): number | null {
  if (normalized === "") {
    return 0;
  }

  const withoutTrailingDot = normalized.endsWith(".")
    ? normalized.slice(0, -1)
    : normalized;

  const num = Number(withoutTrailingDot);
  if (!Number.isFinite(num) || num > MAX_INTEGER_INPUT) {
    return null;
  }

  const decimalPart = withoutTrailingDot.split(".")[1];
  if (decimalPart !== undefined && decimalPart.length > 2) {
    return null;
  }

  return num;
}

/**
 * Normalizes an integer-only input: digits only, clamped to {@link MAX_INTEGER_INPUT}.
 *
 * @param raw - Raw input from a field.
 * @param options.allowEmpty - When true, empty input becomes `""`. When false, empty becomes `"0"`.
 * @returns A string of digits within range, or empty when allowed.
 */
export function normalizeIntegerStringInput(
  raw: string,
  options: { allowEmpty: boolean },
): string {
  const allowEmpty = options.allowEmpty;

  if (allowEmpty && raw === "") {
    return "";
  }

  if (!allowEmpty && raw === "") {
    return "0";
  }

  const digitsOnly = raw.replace(/\D/g, "");

  if (digitsOnly === "") {
    return allowEmpty ? "" : "0";
  }

  let value = Number.parseInt(digitsOnly, 10);
  if (!Number.isFinite(value)) {
    return allowEmpty ? "" : "0";
  }

  if (value > MAX_INTEGER_INPUT) {
    value = MAX_INTEGER_INPUT;
  }

  return String(value);
}

/**
 * Converts a normalized integer string to a number for product state.
 *
 * @param normalized - Output from `normalizeIntegerStringInput` with `allowEmpty: false`.
 * @returns Integer in range, or `null` if invalid.
 */
export function normalizedIntegerStringToNumber(
  normalized: string,
): number | null {
  const num = Number.parseInt(normalized, 10);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return null;
  }
  if (num > MAX_INTEGER_INPUT) {
    return null;
  }
  return num;
}
