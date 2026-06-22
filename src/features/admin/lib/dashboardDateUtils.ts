import {
  buildListDateRangeIso,
  calendarDateToFromIso,
  calendarDateToToIso,
  getDefaultListCalendarDateRange,
} from "@/lib/datetime/listDateRange";

/** UTC calendar date for the first day of the current month (`YYYY-MM-DD`). */
export function getUtcMonthStartCalendarDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/** UTC calendar date for today (`YYYY-MM-DD`). */
export function getUtcTodayCalendarDate(): string {
  return getDefaultListCalendarDateRange(1).toDate;
}

export function calendarDateToStartIso(calendarDate: string): string | undefined {
  return calendarDateToFromIso(calendarDate);
}

export function calendarDateToEndIso(calendarDate: string): string | undefined {
  return calendarDateToToIso(calendarDate);
}

export function buildPriceTrendQueryIso(
  fromCalendarDate: string,
  toCalendarDate: string,
): { startDate: string; endDate: string } | null {
  const range = buildListDateRangeIso(fromCalendarDate, toCalendarDate);
  if (!range) {
    return null;
  }

  return {
    startDate: range.fromDate,
    endDate: range.toDate,
  };
}

/**
 * @param fromCalendarDate - UTC `YYYY-MM-DD` start (inclusive).
 * @param toCalendarDate - UTC `YYYY-MM-DD` end (inclusive).
 * @returns Number of UTC calendar days in the range, or 0 when invalid.
 */
export function countInclusiveUtcCalendarDays(
  fromCalendarDate: string,
  toCalendarDate: string,
): number {
  if (fromCalendarDate > toCalendarDate) {
    return 0;
  }

  const fromMs = Date.parse(`${fromCalendarDate}T00:00:00.000Z`);
  const toMs = Date.parse(`${toCalendarDate}T00:00:00.000Z`);

  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return 0;
  }

  return Math.floor((toMs - fromMs) / 86_400_000) + 1;
}

export function formatChartBucketLabel(
  labelStartDate: string,
  labelEndDate: string,
): string {
  const start = labelStartDate.replace(/-/g, "/");
  if (labelStartDate === labelEndDate) {
    return start;
  }

  const end = labelEndDate.replace(/-/g, "/");
  return `${start} – ${end}`;
}
