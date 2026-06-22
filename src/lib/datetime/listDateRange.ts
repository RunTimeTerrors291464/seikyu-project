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
 * @param iso - UTC ISO timestamp from a list date bound.
 * @returns `YYYY-MM-DD` for HTML date inputs.
 */
export function isoToCalendarDate(iso: string): string {
  const date = new Date(iso);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Default list range as calendar dates for filter inputs.
 */
export function getDefaultListCalendarDateRange(
  rangeDays?: number,
): {
  fromDate: string;
  toDate: string;
} {
  const range = getDefaultListDateRange(rangeDays);
  return {
    fromDate: isoToCalendarDate(range.fromDate),
    toDate: isoToCalendarDate(range.toDate),
  };
}

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param calendarDate - `YYYY-MM-DD` from a date input.
 * @returns UTC start-of-day ISO for `fromDate`, or undefined when invalid.
 */
export function calendarDateToFromIso(calendarDate: string): string | undefined {
  if (!CALENDAR_DATE_PATTERN.test(calendarDate)) {
    return undefined;
  }

  const [year, month, day] = calendarDate.split("-").map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return undefined;
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
}

/**
 * @param calendarDate - `YYYY-MM-DD` from a date input.
 * @returns UTC end-of-day ISO for `toDate`, or undefined when invalid.
 */
export function calendarDateToToIso(calendarDate: string): string | undefined {
  if (!CALENDAR_DATE_PATTERN.test(calendarDate)) {
    return undefined;
  }

  const [year, month, day] = calendarDate.split("-").map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return undefined;
  }

  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString();
}

/**
 * @param fromDate - `YYYY-MM-DD` start of range.
 * @param toDate - `YYYY-MM-DD` end of range.
 * @returns True when both are valid calendar dates and `fromDate` <= `toDate`.
 */
export function isValidCalendarDateRange(
  fromDate: string,
  toDate: string,
): boolean {
  if (
    !CALENDAR_DATE_PATTERN.test(fromDate) ||
    !CALENDAR_DATE_PATTERN.test(toDate)
  ) {
    return false;
  }

  return fromDate <= toDate;
}

/**
 * @param fromCalendarDate - `YYYY-MM-DD` start of range.
 * @param toCalendarDate - `YYYY-MM-DD` end of range.
 * @returns UTC ISO bounds, or null when the calendar range is invalid.
 */
export function buildListDateRangeIso(
  fromCalendarDate: string,
  toCalendarDate: string,
): ListDateRangeIso | null {
  if (!isValidCalendarDateRange(fromCalendarDate, toCalendarDate)) {
    return null;
  }

  const fromDate = calendarDateToFromIso(fromCalendarDate);
  const toDate = calendarDateToToIso(toCalendarDate);

  if (fromDate === undefined || toDate === undefined) {
    return null;
  }

  return { fromDate, toDate };
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
