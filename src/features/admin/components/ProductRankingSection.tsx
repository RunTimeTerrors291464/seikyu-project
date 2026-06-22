"use client";

import DataTable from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Fields";
import TablePagination from "@/components/ui/TablePagination";
import ListFilterSelectGroup from "@/components/ui/ListFilterSelectGroup";
import InvoiceListDateRangeFilter from "@/features/invoices/components/InvoiceListDateRangeFilter";
import {
  DASHBOARD_INVOICE_TYPE_OPTIONS,
  PRODUCT_RANKING_DATE_TYPE_OPTIONS,
  type DashboardInvoiceTypeFilter,
  type ProductRankingDateTypeFilter,
} from "@/features/admin/filters/dashboardFilters";
import { useProductRanking } from "@/features/admin/hooks/useProductRanking";
import {
  buildPriceTrendQueryIso,
  calendarDateToStartIso,
  getUtcMonthStartCalendarDate,
  getUtcTodayCalendarDate,
} from "@/features/admin/lib/dashboardDateUtils";
import { productRankingColumns } from "@/features/admin/table/productRankingColumns";
import { useInvoiceListDateRangeFilter } from "@/features/invoices/hooks/useInvoiceListDateRangeFilter";
import { useDict } from "@/lib/lang/DictProvider";
import { useMemo, useState } from "react";
import type { Accent } from "@/components/types/ui";

const RANKING_DEFAULT_PAGE_SIZE = 30;

export default function ProductRankingSection() {
  const dict = useDict();
  const [invoiceType, setInvoiceType] =
    useState<DashboardInvoiceTypeFilter>("selling");
  const [dateType, setDateType] =
    useState<ProductRankingDateTypeFilter>("monthly");
  const [startCalendarDate, setStartCalendarDate] = useState<string>(
    getUtcMonthStartCalendarDate(),
  );
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(RANKING_DEFAULT_PAGE_SIZE);
  const customRange = useInvoiceListDateRangeFilter(30);

  const rankingQuery = useMemo(
    function buildRankingQuery() {
      if (dateType === "custom") {
        const range = buildPriceTrendQueryIso(
          customRange.fromDate,
          customRange.toDate,
        );
        if (!range) {
          return null;
        }

        return {
          page,
          limit: rowsPerPage,
          search: search.trim() || undefined,
          sortOrder: "desc" as const,
          invoiceType,
          dateType,
          startDate: range.startDate,
          endDate: range.endDate,
        };
      }

      const startDate = calendarDateToStartIso(startCalendarDate);
      if (!startDate) {
        return null;
      }

      return {
        page,
        limit: rowsPerPage,
        search: search.trim() || undefined,
        sortOrder: "desc" as const,
        invoiceType,
        dateType,
        startDate,
      };
    },
    [
      customRange.fromDate,
      customRange.toDate,
      dateType,
      invoiceType,
      page,
      search,
      startCalendarDate,
      rowsPerPage,
    ],
  );

  const { rows, total, loading, error } = useProductRanking(rankingQuery);

  const columns = useMemo(
    function buildColumns() {
      return productRankingColumns(dict, {
        dateType,
        pagination: { page, rowsPerPage },
      });
    },
    [dateType, dict, page, rowsPerPage],
  );

  const invoiceTypeOptions = useMemo(
    function buildInvoiceTypeOptions() {
      return DASHBOARD_INVOICE_TYPE_OPTIONS.map(function mapOption(option) {
        return { value: option.value, label: dict[option.dictKey] };
      });
    },
    [dict],
  );

  const dateTypeOptions = useMemo(
    function buildDateTypeOptions() {
      return PRODUCT_RANKING_DATE_TYPE_OPTIONS.map(function mapOption(option) {
        return { value: option.value, label: dict[option.dictKey] };
      });
    },
    [dict],
  );

  const totalPages = total === 0 ? 1 : Math.ceil(total / rowsPerPage);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">{dict.dashboardProductRankingTitle}</h2>
        <p className="mt-0.5 text-xs text-muted">
          {dict.dashboardProductRankingSubtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
        <ListFilterSelectGroup
          label={dict.dashboardInvoiceTypeLabel}
          options={invoiceTypeOptions}
          value={invoiceType}
          onChange={function selectInvoiceType(value): void {
            setInvoiceType(value);
            setPage(1);
          }}
          allValue="selling"
          accentForValue={function invoiceTypeAccent(
            optionValue,
          ): Accent {
            if (optionValue === "selling") {
              return "success";
            }
            if (optionValue === "returnSelling" || optionValue === "returnImport") {
              return "danger";
            }
            if (optionValue === "import") {
              return "primary";
            }
            return "neutral";
          }}
        />

        <ListFilterSelectGroup
          label={dict.dashboardDateTypeLabel}
          options={dateTypeOptions}
          value={dateType}
          onChange={function selectDateType(value): void {
            setDateType(value);
            setPage(1);
            if (value === "daily") {
              setStartCalendarDate(getUtcTodayCalendarDate());
              return;
            }
            if (value === "monthly") {
              setStartCalendarDate(getUtcMonthStartCalendarDate());
              return;
            }
            if (value === "yearly") {
              setStartCalendarDate(
                `${new Date().getUTCFullYear()}-01-01`,
              );
            }
          }}
          allValue="monthly"
          accentForValue={function dateTypeAccent(): Accent {
            return "primary";
          }}
        />

        {dateType === "custom" ? (
          <InvoiceListDateRangeFilter
            fromDate={customRange.fromDate}
            toDate={customRange.toDate}
            onFromDateChange={function handleFromDateChange(value): void {
              customRange.setFromDate(value);
              setPage(1);
            }}
            onToDateChange={function handleToDateChange(value): void {
              customRange.setToDate(value);
              setPage(1);
            }}
            className="ml-0"
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{dict.dashboardRankingStartDateLabel}</span>
            <Input
              type="date"
              value={startCalendarDate}
              onChange={function handleStartDateChange(value): void {
                setStartCalendarDate(value);
                setPage(1);
              }}
              className="!h-6 !w-[7rem] shrink-0 !min-w-0 !px-1.5 !py-0 !text-xs"
            />
          </div>
        )}

        <Input
          value={search}
          onChange={function handleSearchChange(value): void {
            setSearch(value);
            setPage(1);
          }}
          placeholder={dict.dashboardProductSearchPlaceholder}
          className="max-w-sm"
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error.message}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        getRowId={(row) => row.id}
        maxHeight="expand"
        emptyMessage={dict.noData}
      />

      <TablePagination
        page={page}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={function handleRowsPerPageChange(value): void {
          setRowsPerPage(value);
          setPage(1);
        }}
        setPage={setPage}
        totalResults={total}
        dict={dict}
      />
    </section>
  );
}
