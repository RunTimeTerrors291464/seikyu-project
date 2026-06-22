import type { SellingInvoiceWithoutProductsDto } from "@/features/invoices/services/sellingInvoice.service";
import { isoToCalendarDate } from "@/lib/datetime/listDateRange";

export type DailySellingIncomeRow = {
  /** UTC calendar date (`YYYY-MM-DD`). */
  date: string;
  totalHuf: number;
};

export type DailySellingIncomeHighestInvoice = {
  invoiceId: string | null;
  totalSellingPrice: number;
};

export type DailySellingIncomeResult = {
  rows: DailySellingIncomeRow[];
  grandTotalHuf: number;
  invoiceCount: number;
  highestValueInvoice: DailySellingIncomeHighestInvoice | null;
  averageInvoicesPerDay: number;
};

type InvoiceIncomeSlice = Pick<
  SellingInvoiceWithoutProductsDto,
  "confirmedAt" | "totalSellingPrice" | "invoiceId"
>;

/**
 * Groups confirmed selling invoices into UTC calendar-day income totals.
 * Return-selling invoices are not considered; each sale counts at face value.
 */
export function aggregateDailySellingIncome(
  invoices: readonly InvoiceIncomeSlice[],
  inclusiveDayCount: number,
): DailySellingIncomeResult {
  const totalsByDate = new Map<string, number>();
  let invoiceCount = 0;
  let highestValueInvoice: DailySellingIncomeHighestInvoice | null = null;

  invoices.forEach(function sumInvoice(invoice): void {
    if (!invoice.confirmedAt) {
      return;
    }

    invoiceCount += 1;

    if (
      highestValueInvoice === null ||
      invoice.totalSellingPrice > highestValueInvoice.totalSellingPrice
    ) {
      highestValueInvoice = {
        invoiceId: invoice.invoiceId,
        totalSellingPrice: invoice.totalSellingPrice,
      };
    }

    const date = isoToCalendarDate(invoice.confirmedAt);
    const currentTotal = totalsByDate.get(date) ?? 0;
    totalsByDate.set(date, currentTotal + invoice.totalSellingPrice);
  });

  const rows = [...totalsByDate.entries()]
    .map(function mapRow([date, totalHuf]): DailySellingIncomeRow {
      return { date, totalHuf };
    })
    .sort(function sortByDateDesc(left, right): number {
      return right.date.localeCompare(left.date);
    });

  const grandTotalHuf = rows.reduce(function sumGrandTotal(total, row): number {
    return total + row.totalHuf;
  }, 0);

  const averageInvoicesPerDay =
    inclusiveDayCount > 0 ? invoiceCount / inclusiveDayCount : 0;

  return {
    rows,
    grandTotalHuf,
    invoiceCount,
    highestValueInvoice,
    averageInvoicesPerDay,
  };
}
