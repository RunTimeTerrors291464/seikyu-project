import {
  aggregateDailySellingIncome,
  type DailySellingIncomeResult,
  type DailySellingIncomeRow,
} from "@/features/admin/lib/aggregateDailySellingIncome";
import { countInclusiveUtcCalendarDays } from "@/features/admin/lib/dashboardDateUtils";
import {
  getSellingInvoiceList,
  type SellingInvoiceWithoutProductsDto,
} from "@/features/invoices/services/sellingInvoice.service";
import {
  isoToCalendarDate,
  mergeDefaultListDateRange,
} from "@/lib/datetime/listDateRange";

export type { DailySellingIncomeRow, DailySellingIncomeResult };

export type DailySellingIncomeQuery = {
  fromDate?: string;
  toDate?: string;
};

const SELLING_INVOICE_FETCH_PAGE_SIZE = 100;

async function fetchAllSellingInvoicesInRange(
  fromDate: string,
  toDate: string,
): Promise<SellingInvoiceWithoutProductsDto[]> {
  const invoices: SellingInvoiceWithoutProductsDto[] = [];
  let page = 1;

  while (true) {
    const response = await getSellingInvoiceList({
      fromDate,
      toDate,
      page,
      limit: SELLING_INVOICE_FETCH_PAGE_SIZE,
      sortBy: "confirmedAt",
      sortOrder: "asc",
    });

    invoices.push(...response.invoices);

    if (
      response.invoices.length === 0 ||
      invoices.length >= response.total
    ) {
      break;
    }

    page += 1;
  }

  return invoices;
}

export async function getDailySellingIncome(
  params: DailySellingIncomeQuery,
): Promise<DailySellingIncomeResult> {
  const { fromDate, toDate } = mergeDefaultListDateRange(params);

  if (!fromDate || !toDate) {
    return {
      rows: [],
      grandTotalHuf: 0,
      invoiceCount: 0,
      highestValueInvoice: null,
      averageInvoicesPerDay: 0,
    };
  }

  const invoices = await fetchAllSellingInvoicesInRange(fromDate, toDate);
  const inclusiveDayCount = countInclusiveUtcCalendarDays(
    isoToCalendarDate(fromDate),
    isoToCalendarDate(toDate),
  );

  return aggregateDailySellingIncome(invoices, inclusiveDayCount);
}
