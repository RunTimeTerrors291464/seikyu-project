"use client";

import PriceTrendChart from "@/features/admin/components/PriceTrendChart";
import { usePriceTrend } from "@/features/admin/hooks/usePriceTrend";
import { buildPriceTrendQueryIso } from "@/features/admin/lib/dashboardDateUtils";
import InvoiceListDateRangeFilter from "@/features/invoices/components/InvoiceListDateRangeFilter";
import { useInvoiceListDateRangeFilter } from "@/features/invoices/hooks/useInvoiceListDateRangeFilter";
import { useDict } from "@/lib/lang/DictProvider";
import { useMemo } from "react";

const PRICE_TREND_DEFAULT_RANGE_DAYS = 30;

export default function PriceTrendSection() {
  const dict = useDict();
  const {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    listDateRange,
  } = useInvoiceListDateRangeFilter(PRICE_TREND_DEFAULT_RANGE_DAYS);

  const priceTrendQuery = useMemo(
    function buildQuery() {
      const range = buildPriceTrendQueryIso(fromDate, toDate);
      if (!range) {
        return null;
      }

      return {
        startDate: range.startDate,
        endDate: range.endDate,
      };
    },
    [fromDate, listDateRange.fromDate, listDateRange.toDate, toDate],
  );

  const { columns, loading, error } = usePriceTrend(priceTrendQuery);

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">{dict.dashboardPriceTrendTitle}</h2>
        <p className="mt-0.5 text-xs text-muted">{dict.dashboardPriceTrendSubtitle}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <InvoiceListDateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          className="ml-0"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error.message}
        </div>
      ) : null}

      <PriceTrendChart dict={dict} columns={columns} loading={loading} />
    </section>
  );
}
