/** Maximum calendar-day span allowed by list APIs that pair `fromDate` with `toDate`. */
export const LIST_DATE_RANGE_MAX_DAYS = 180;

const DEFAULT_LIST_DATE_RANGE_DAYS = LIST_DATE_RANGE_MAX_DAYS;

export type ListDateRangeIso = {
  fromDate: string;
  toDate: string;
};

/**
 * Builds UTC ISO 8601 `fromDate` / `toDate` for list endpoints that require a bounded range.
 *
 * @param rangeDays - Number of calendar days ending today (inclusive); clamped to 1..{@link LIST_DATE_RANGE_MAX_DAYS}.
 * @returns Start of the first UTC day through end of the last UTC day (23:59:59.999 today when range is 1).
 */
export function getDefaultListDateRange(
  rangeDays: number = DEFAULT_LIST_DATE_RANGE_DAYS,
): ListDateRangeIso {
  const cappedDays = Math.min(
    Math.max(rangeDays, 1),
    LIST_DATE_RANGE_MAX_DAYS,
  );
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - (cappedDays - 1));

  const fromIso = new Date(
    Date.UTC(
      fromDate.getUTCFullYear(),
      fromDate.getUTCMonth(),
      fromDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  ).toISOString();

  const toIso = new Date(
    Date.UTC(
      toDate.getUTCFullYear(),
      toDate.getUTCMonth(),
      toDate.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  ).toISOString();

  return { fromDate: fromIso, toDate: toIso };
}

/**
 * Fills missing `fromDate` / `toDate` on a list query using {@link getDefaultListDateRange}.
 *
 * @param params - Query object that may omit either bound.
 * @param rangeDays - Optional lookback length passed to {@link getDefaultListDateRange}.
 * @returns Same shape with both dates set when either was missing.
 */
export function mergeDefaultListDateRange<
  T extends { fromDate?: string; toDate?: string },
>(params: T, rangeDays?: number): T {
  if (params.fromDate && params.toDate) {
    return params;
  }

  const defaults = getDefaultListDateRange(rangeDays);
  return {
    ...params,
    fromDate: params.fromDate ?? defaults.fromDate,
    toDate: params.toDate ?? defaults.toDate,
  };
}
