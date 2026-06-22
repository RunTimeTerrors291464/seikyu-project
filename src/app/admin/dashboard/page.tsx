"use client";

import Button from "@/components/ui/Buttons";
import DataTable from "@/components/ui/DataTable";
import KpiTile from "@/components/ui/KpiTile";
import { useDailySellingIncome } from "@/features/admin/hooks/useDailySellingIncome";
import { dailyIncomeColumns } from "@/features/admin/table/dailyIncomeColumns";
import InvoiceListDateRangeFilter from "@/features/invoices/components/InvoiceListDateRangeFilter";
import { useInvoiceListDateRangeFilter } from "@/features/invoices/hooks/useInvoiceListDateRangeFilter";
import { useDict } from "@/lib/lang/DictProvider";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import {
  BarChart3,
  DollarSign,
  FileText,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const DASHBOARD_DEFAULT_RANGE_DAYS = 30;

function formatAverageInvoicesPerDay(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function AdminDashboardPage() {
  const dict = useDict();
  const {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    listDateRange,
    isDefaultRange,
    resetDateRange,
  } = useInvoiceListDateRangeFilter(DASHBOARD_DEFAULT_RANGE_DAYS);

  const {
    rows,
    grandTotalHuf,
    invoiceCount,
    highestValueInvoice,
    averageInvoicesPerDay,
    loading,
    error,
  } = useDailySellingIncome({
    fromDate: listDateRange.fromDate,
    toDate: listDateRange.toDate,
  });

  const columns = useMemo(
    function buildColumns() {
      return dailyIncomeColumns(dict);
    },
    [dict],
  );

  const isResetFilterDisabled = isDefaultRange;
  const kpiPlaceholder = loading ? "—" : undefined;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-8 overflow-y-auto pb-6">
      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{dict.dailyIncomeTitle}</h2>
            <p className="mt-0.5 text-xs text-muted">{dict.dailyIncomeUtcHint}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              accent="neutral"
              size="sm"
              onClick={resetDateRange}
              disabled={isResetFilterDisabled}
            >
              {dict.resetFilter}
            </Button>
            <InvoiceListDateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              className="ml-0"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error.message}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label={dict.dailyIncomeGrandTotalLabel}
            value={
              kpiPlaceholder ??
              `${formatPriceNumber(grandTotalHuf)} ${dict.dashboardCurrencySuffix}`
            }
            icon={<DollarSign className="h-4 w-4 text-muted" />}
            accent="primary"
            helpText={dict.dailyIncomeGrandTotalHelp}
            sub={dict.dailyIncomeGrandTotalSub}
          />

          <KpiTile
            label={dict.dailyIncomeInvoiceCountLabel}
            value={kpiPlaceholder ?? invoiceCount.toLocaleString()}
            icon={<FileText className="h-4 w-4 text-muted" />}
            helpText={dict.dailyIncomeInvoiceCountHelp}
            sub={dict.dailyIncomeInvoiceCountSub}
          />

          <KpiTile
            label={dict.dailyIncomeHighestInvoiceLabel}
            value={
              kpiPlaceholder ??
              (highestValueInvoice
                ? `${formatPriceNumber(highestValueInvoice.totalSellingPrice)} ${dict.dashboardCurrencySuffix}`
                : "—")
            }
            icon={<TrendingUp className="h-4 w-4 text-muted" />}
            accent="success"
            helpText={dict.dailyIncomeHighestInvoiceHelp}
            sub={
              loading
                ? undefined
                : highestValueInvoice?.invoiceId
                  ? `${dict.invoiceNumber}: ${highestValueInvoice.invoiceId}`
                  : dict.dailyIncomeHighestInvoiceEmptySub
            }
          />

          <KpiTile
            label={dict.dailyIncomeAvgInvoicesPerDayLabel}
            value={
              kpiPlaceholder ??
              formatAverageInvoicesPerDay(averageInvoicesPerDay)
            }
            icon={<BarChart3 className="h-4 w-4 text-muted" />}
            helpText={dict.dailyIncomeAvgInvoicesPerDayHelp}
            sub={dict.dailyIncomeAvgInvoicesPerDaySub}
          />
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          getRowId={(row) => row.date}
          maxHeight="expand"
        />

        <p className="text-xs text-muted">
          {dict.dailyIncomeDrillDownHint}{" "}
          <Link
            href="/manager/invoices/selling"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {dict.sellingInvoicesManager}
          </Link>
        </p>
      </section>

      {/* <PriceTrendSection />

      <ProductRankingSection /> */}
    </div>
  );
}
