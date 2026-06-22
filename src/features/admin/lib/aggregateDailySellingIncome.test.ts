import { describe, expect, it } from "vitest";

import { aggregateDailySellingIncome } from "@/features/admin/lib/aggregateDailySellingIncome";

describe("aggregateDailySellingIncome", () => {
  it("groups totals by UTC calendar day of confirmedAt", () => {
    const result = aggregateDailySellingIncome(
      [
        {
          confirmedAt: "2026-06-10T10:00:00.000Z",
          totalSellingPrice: 600_000,
          invoiceId: "S-001",
        },
        {
          confirmedAt: "2026-06-10T22:30:00.000Z",
          totalSellingPrice: 400_000,
          invoiceId: "S-002",
        },
        {
          confirmedAt: "2026-06-11T00:30:00.000Z",
          totalSellingPrice: 250_000,
          invoiceId: "S-003",
        },
      ],
      30,
    );

    expect(result.rows).toEqual([
      { date: "2026-06-11", totalHuf: 250_000 },
      { date: "2026-06-10", totalHuf: 1_000_000 },
    ]);
    expect(result.grandTotalHuf).toBe(1_250_000);
    expect(result.invoiceCount).toBe(3);
    expect(result.highestValueInvoice).toEqual({
      invoiceId: "S-001",
      totalSellingPrice: 600_000,
    });
    expect(result.averageInvoicesPerDay).toBeCloseTo(0.1);
  });

  it("skips invoices without confirmedAt", () => {
    const result = aggregateDailySellingIncome(
      [
        {
          confirmedAt: null,
          totalSellingPrice: 100_000,
          invoiceId: "S-000",
        },
        {
          confirmedAt: "2026-06-10T12:00:00.000Z",
          totalSellingPrice: 50_000,
          invoiceId: "S-010",
        },
      ],
      1,
    );

    expect(result.rows).toEqual([{ date: "2026-06-10", totalHuf: 50_000 }]);
    expect(result.grandTotalHuf).toBe(50_000);
    expect(result.invoiceCount).toBe(1);
    expect(result.highestValueInvoice).toEqual({
      invoiceId: "S-010",
      totalSellingPrice: 50_000,
    });
    expect(result.averageInvoicesPerDay).toBe(1);
  });

  it("returns empty totals when there are no invoices", () => {
    const result = aggregateDailySellingIncome([], 7);

    expect(result.rows).toEqual([]);
    expect(result.grandTotalHuf).toBe(0);
    expect(result.invoiceCount).toBe(0);
    expect(result.highestValueInvoice).toBeNull();
    expect(result.averageInvoicesPerDay).toBe(0);
  });
});
