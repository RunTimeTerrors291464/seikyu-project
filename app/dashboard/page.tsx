import KpiCard from "./components/KpiCard";
import PageHeader from "@/components/layout/PageHeader";
import DatePeriodControls from "@/components/dashboard/DatePeriodControls";
import ChartCard from "./components/ChartCard";
import { addDays, subDays } from "date-fns";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top header row to match design: title left, filters right */}
      <PageHeader title="Overview" actions={<DatePeriodControls />} />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value="$11,900,000"
          delta={{ value: 3.68, type: "increase" }}
          helpText="Sum of revenue within the selected date range."
        />
        <KpiCard
          label="Total Product Imported"
          value="119,000"
          delta={{ value: -3.68, type: "decrease" }}
          helpText="Total quantity of products imported during the selected date range."
        />
        <KpiCard
          label="Total Product Sold"
          value="2,317"
          delta={{ value: 3.68, type: "increase" }}
          helpText="Total quantity of products sold during the selected date range."
        />
        <KpiCard
          label="Total Invoice"
          value="101"
          delta={{ value: 3.68, type: "increase" }}
          helpText="Number of invoices created within the selected date range."
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            data={Array.from({ length: 12 }).map((_, i) => ({
              x: addDays(subDays(new Date(), 11), i),
              y: 80000 + Math.round(40000 * Math.sin((i / 11) * Math.PI * 1.2) + 15000 * Math.random()),
            }))}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
          <div className="mb-3 text-sm font-medium">Best Selling Items</div>
          <div className="h-48 w-full rounded-md bg-neutral-50 dark:bg-neutral-800" />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
        <div className="mb-3 text-sm font-medium">System Event Log</div>
        <div className="h-40 w-full rounded-md bg-neutral-50 dark:bg-neutral-800" />
      </section>
    </div>
  );
}
