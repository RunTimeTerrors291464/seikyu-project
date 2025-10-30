import KpiCard from "./components/KpiCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Revenue" value="$11,900,000" delta={{ value: 3.68, type: "increase" }} />
        <KpiCard label="Total Product Imported" value="119,000" delta={{ value: -3.68, type: "decrease" }} />
        <KpiCard label="Total Product Sold" value="2,317" delta={{ value: 3.68, type: "increase" }} />
        <KpiCard label="Total Invoice" value="101" delta={{ value: 3.68, type: "increase" }} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900 lg:col-span-2">
          <div className="mb-3 text-sm font-medium">Charts</div>
          <div className="h-48 w-full rounded-md bg-neutral-50 dark:bg-neutral-800" />
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
