import KpiCard from "./components/KpiCard";
import PageHeader from "@/components/layout/PageHeader";
import ChartCard from "./components/ChartCard";
import BestSellingItemsCard from "./components/BestSellingItemsCard";
import SystemEventLogCard from "./components/SystemEventLogCard";
import { addDays, subDays } from "date-fns";
import MasterDateControls from "@/components/dashboard/MasterDateControls";
import { DashboardDateProvider } from "@/components/dashboard/DashboardDateContext";

export default function DashboardPage() {
  return (
    <DashboardDateProvider>
      <div className="flex grow flex-col space-y-6">
        {/* Top header row to match design: title left, filters right */}
        <PageHeader title="Overview" actions={<MasterDateControls />} />
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          data={Array.from({ length: 12 }).map((_, i) => ({
            x: addDays(subDays(new Date(), 11), i),
            y: 80000 + Math.round(40000 * Math.sin((i / 11) * Math.PI * 1.2) + 15000 * Math.random()),
          }))}
        />
        <BestSellingItemsCard />
      </section>
      
      {/* Because AppShell (the layout component) has the min-h-0 attribute, padding bottom in scrolling pages like dashboard page is disabled. Therefore, we add padding bottom here for spacing */}
      <div className="pb-6"> {/* Padding bottom for spacing */}
        <SystemEventLogCard />
      </div>
      </div>
    </DashboardDateProvider>
  );
}
