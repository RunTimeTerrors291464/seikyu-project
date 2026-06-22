"use client";

import type { PriceTrendRow } from "@/features/admin/hooks/usePriceTrend";
import { formatChartBucketLabel } from "@/features/admin/lib/dashboardDateUtils";
import type { Dictionary } from "@/lib/lang/i18n";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SERIES_CONFIG = [
  {
    key: "selling" as const,
    color: "#16a34a",
    dictKey: "dashboardInvoiceTypeSelling" as const,
  },
  {
    key: "import" as const,
    color: "#2563eb",
    dictKey: "dashboardInvoiceTypeImport" as const,
  },
  {
    key: "returnSelling" as const,
    color: "#dc2626",
    dictKey: "dashboardInvoiceTypeReturnSelling" as const,
  },
  {
    key: "returnImport" as const,
    color: "#9333ea",
    dictKey: "dashboardInvoiceTypeReturnImport" as const,
  },
  {
    key: "stockAdjustment" as const,
    color: "#d97706",
    dictKey: "dashboardInvoiceTypeStockAdjustment" as const,
  },
];

type ChartPoint = PriceTrendRow & {
  label: string;
};

type PriceTrendChartProps = {
  dict: Dictionary;
  columns: PriceTrendRow[];
  loading: boolean;
};

function buildChartData(columns: PriceTrendRow[]): ChartPoint[] {
  return columns.map(function mapColumn(column): ChartPoint {
    return {
      ...column,
      label: formatChartBucketLabel(column.labelStartDate, column.labelEndDate),
    };
  });
}

function PriceTrendTooltip({
  active,
  payload,
  label,
  dict,
}: {
  active?: boolean;
  payload?: readonly { color?: string; name?: string; value?: number }[];
  label?: string;
  dict: Dictionary;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-2 font-medium text-foreground">{label}</p>
      <ul className="space-y-1">
        {payload.map(function renderEntry(entry) {
          return (
            <li
              key={String(entry.name)}
              className="flex items-center justify-between gap-4 tabular-nums"
            >
              <span className="flex items-center gap-1.5 text-muted">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-medium text-foreground">
                {formatPriceNumber(entry.value)} {dict.dashboardCurrencySuffix}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const CHART_HEIGHT_PX = 320;

export default function PriceTrendChart({
  dict,
  columns,
  loading,
}: PriceTrendChartProps) {
  const chartData = buildChartData(columns);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-card text-sm text-muted"
        style={{ height: CHART_HEIGHT_PX }}
      >
        {dict.loading}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-border bg-card text-sm text-muted"
        style={{ height: CHART_HEIGHT_PX }}
      >
        {dict.noData}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 rounded-lg border border-border bg-card p-3 shadow-sm">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX} minWidth={0}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
          >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={72}
            tickFormatter={function formatAxis(value: number): string {
              return formatPriceNumber(value);
            }}
          />
          <Tooltip content={<PriceTrendTooltip dict={dict} />} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={function formatLegend(value: string): string {
              return value;
            }}
          />
          {SERIES_CONFIG.map(function renderSeries(series) {
            return (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={dict[series.dictKey]}
                stroke={series.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
