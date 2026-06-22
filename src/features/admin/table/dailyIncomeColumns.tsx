import type { Column } from "@/components/ui/DataTable";
import type { DailyIncomeRow } from "@/features/admin/hooks/useDailySellingIncome";
import type { Dictionary } from "@/lib/lang/i18n";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";

/**
 * Formats a UTC calendar date (`YYYY-MM-DD`) for dashboard display.
 */
export function formatUtcCalendarDateDisplay(date: string): string {
  return date.replace(/-/g, "/");
}

export function dailyIncomeColumns(dict: Dictionary): Column<DailyIncomeRow>[] {
  return [
    {
      id: "date",
      header: dict.dailyIncomeDateColumn,
      field: "date",
      sortable: false,
      accessor: function renderDate(row): string {
        return formatUtcCalendarDateDisplay(row.date);
      },
    },
    {
      id: "totalHuf",
      header: dict.totalSellingPriceLabel,
      field: "totalHuf",
      sortable: false,
      align: "right",
      accessor: function renderTotal(row): string {
        return formatPriceNumber(row.totalHuf);
      },
    },
  ];
}
