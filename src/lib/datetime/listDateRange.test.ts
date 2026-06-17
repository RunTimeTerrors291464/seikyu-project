import { describe, expect, it } from "vitest";

import {
  buildListDateRangeIso,
  calendarDateToFromIso,
  calendarDateToToIso,
  isValidCalendarDateRange,
  isoToCalendarDate,
  mergeDefaultListDateRange,
} from "@/lib/datetime/listDateRange";

describe("listDateRange", () => {
  it("converts calendar dates to UTC day bounds", () => {
    expect(calendarDateToFromIso("2024-06-01")).toBe("2024-06-01T00:00:00.000Z");
    expect(calendarDateToToIso("2024-06-01")).toBe("2024-06-01T23:59:59.999Z");
  });

  it("validates calendar ranges", () => {
    expect(isValidCalendarDateRange("2024-06-01", "2024-06-30")).toBe(true);
    expect(isValidCalendarDateRange("2024-06-30", "2024-06-01")).toBe(false);
    expect(isValidCalendarDateRange("bad", "2024-06-01")).toBe(false);
  });

  it("builds ISO ranges from valid calendar input", () => {
    expect(buildListDateRangeIso("2024-06-01", "2024-06-02")).toEqual({
      fromDate: "2024-06-01T00:00:00.000Z",
      toDate: "2024-06-02T23:59:59.999Z",
    });
    expect(buildListDateRangeIso("2024-06-02", "2024-06-01")).toBeNull();
  });

  it("round-trips default ISO bounds to calendar dates", () => {
    const iso = "2024-03-15T12:30:00.000Z";
    expect(isoToCalendarDate(iso)).toBe("2024-03-15");
  });

  it("fills missing list query bounds", () => {
    type SampleListQuery = { page: number; fromDate?: string; toDate?: string };
    const merged = mergeDefaultListDateRange<SampleListQuery>({ page: 1 });

    expect(merged.page).toBe(1);
    expect(merged.fromDate).toMatch(/T00:00:00.000Z$/);
    expect(merged.toDate).toMatch(/T23:59:59.999Z$/);
  });
});
