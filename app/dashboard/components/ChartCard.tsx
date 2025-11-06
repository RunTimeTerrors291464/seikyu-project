"use client";
import { LineChart, ChevronDown, Info } from "lucide-react";
import AreaLineChart, { Point } from "@/components/charts/AreaLineChart";
import { Period } from "@/components/dashboard/DatePeriodControls";
import { useRef, useState } from "react";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import Tooltip from "@/components/ui/Tooltip";
import { addDays, addMonths, addWeeks, isBefore, differenceInDays, startOfDay } from "date-fns";
import { useDashboardDate } from "@/components/dashboard/DashboardDateContext";
import { PeriodSelect } from "@/components/ui/PeriodSelect";

type Props = {
  title?: string;
  data: Point[];
};

const METRICS = ["Revenue", "Product Imported", "Product Sold", "Invoice"] as const;
type Metric = typeof METRICS[number];

export default function ChartCard({ title = "Charts", data }: Props) {
  const [openMenu, setOpenMenu] = useState(false);
  const [metric, setMetric] = useState<Metric>("Revenue");
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setOpenMenu(false));
  // Use master date range from context
  const { startDate, endDate } = useDashboardDate();
  const [period, setPeriod] = useState<Period>("Weekly");

  // Allowed granularity options based on selected range (simple rules)
  const allowedOptions = (() => {
    const spanDays = Math.max(1, differenceInDays(endDate, startDate));
    if (spanDays <= 45) return ["Daily", "Weekly", "Monthly"] as Period[];
    if (spanDays <= 120) return ["Weekly", "Monthly", "Quarterly"] as Period[];
    if (spanDays <= 540) return ["Monthly", "Quarterly", "Yearly"] as Period[];
    return ["Quarterly", "Yearly"] as Period[];
  })();
  // Ensure period is valid when range changes
  if (!allowedOptions.includes(period)) {
    // pick the closest sensible default
    const next = allowedOptions[0];
    if (period !== next) setPeriod(next);
  }

  const series: Point[] = generateMockSeries({ startDate, endDate, period, metric });

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            <LineChart className="h-4 w-4 text-neutral-500" />
            <span>{title}</span>
          </div>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={openMenu}
              className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow-sm dark:bg-neutral-900"
            >
              {metric} <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </button>
            {openMenu && (
              <div className="absolute left-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border bg-white py-1 text-sm shadow-lg dark:bg-neutral-900">
                {METRICS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMetric(m);
                      setOpenMenu(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                      metric === m ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelect value={period} options={allowedOptions} onChange={(v) => setPeriod(v as Period)} ariaLabel="Change chart granularity" />
          <Tooltip content={`${metric} over the selected date range. Hover on the chart to inspect values.`}>
            <button
              type="button"
              aria-label="About chart"
              className="text-neutral-300 transition-colors hover:text-neutral-500 focus:outline-none"
            >
              <Info className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Chart */}
  <AreaLineChart data={series} height={260} period={period} />
    </div>
  );
}

function generateMockSeries({
  startDate,
  endDate,
  period,
  metric,
}: {
  startDate: Date;
  endDate: Date;
  period: Period;
  metric: Metric;
}): Point[] {
  const pts: Point[] = [];
  let cursor = new Date(startDate);
  // Clamp end date for daily so we never generate a point beyond today
  const normalizedEnd = period === "Daily" ? startOfDay(endDate) : endDate;
  const step = (d: Date) => {
    if (period === "Daily") return addDays(d, 1);
    if (period === "Weekly") return addWeeks(d, 1);
    if (period === "Monthly") return addMonths(d, 1);
    if (period === "Quarterly") return addMonths(d, 3);
    return addMonths(d, 12);
  };
  let i = 0;
  while (isBefore(cursor, addDays(normalizedEnd, 1))) {
    const base = metricBase(metric);
    const wave = Math.sin(i / 3) * base * 0.08;
    const noise = (Math.random() - 0.5) * base * 0.04;
    const trend = i * (base * 0.005) * (metric === "Revenue" ? 1 : metric === "Product Imported" ? -0.5 : 0.3);
    const y = Math.max(0, base + wave + noise + trend);
    pts.push({ x: new Date(cursor), y });
    cursor = step(cursor);
    i += 1;
  }
  return pts;
}

function metricBase(metric: Metric): number {
  switch (metric) {
    case "Revenue":
      return 100000;
    case "Product Imported":
      return 50000;
    case "Product Sold":
      return 3000;
    case "Invoice":
      return 120;
    default:
      return 1000;
  }
}
