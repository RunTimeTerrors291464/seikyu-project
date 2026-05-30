/**
 * Drops undefined, null, and empty-string entries from invoice list query objects.
 *
 * @param params - Raw list query from a page or hook.
 * @returns A new object containing only defined, non-empty values.
 */
export function cleanInvoiceListParams<T extends object>(params: T): T {
  const cleaned = {} as T;

  (
    Object.entries(params) as [keyof T, T[keyof T] | undefined][]
  ).forEach(function filterParam([key, value]): void {
    if (value === undefined || value === null || value === "") {
      return;
    }

    cleaned[key] = value as T[keyof T];
  });

  return cleaned;
}
