/**
 * @param value - Raw string from a numeric or money input.
 * @returns True when the trimmed value is empty.
 */
export function isEmptyValue(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * @param value - Raw string from a numeric or money input.
 * @returns True when the parsed number is zero.
 */
export function isZeroValue(value: string): boolean {
  return Number(value) === 0;
}
