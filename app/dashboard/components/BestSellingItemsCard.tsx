"use client";
import { Trophy, Filter, Barcode, Package, Tag, ExternalLink, Info } from "lucide-react";
import DataTable, { Column } from "@/components/ui/DataTable";
import IconCircleButton from "@/components/ui/IconCircleButton";
import Tooltip from "@/components/ui/Tooltip";
import { useDashboardDate } from "@/components/dashboard/DashboardDateContext";

export type BestSellingItem = {
  sku: string;
  name: string;
  units: number;
  deltaPct?: number; // positive or negative
};

function formatNumber(n: number) {
  return n.toLocaleString();
}

export default function BestSellingItemsCard() {
  const { preset } = useDashboardDate();

  // Mock data
  const rows: BestSellingItem[] = [
    { sku: "9876543210128", name: "RapidCharge Power Bank", units: 9326, deltaPct: -3.68 },
    { sku: "2957486032198", name: "FreshBrew Coffee Maker", units: 8974, deltaPct: 3.68 },
    { sku: "6401829573345", name: "CozyLite Desk Lamp", units: 5641, deltaPct: 3.68 },
    { sku: "13", name: "PureGlow Face Serum", units: 5235, deltaPct: -3.68 },
    { sku: "142", name: "EcoSmart Water Bottle", units: 4795, deltaPct: -3.68 },
  ];

  const columns: Column<BestSellingItem>[] = [
    {
      id: "sku",
      header: "SKU",
      icon: <Barcode className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => (
        <span className="tabular-nums text-neutral-700 dark:text-neutral-200">{r.sku}</span>
      ),
    },
    {
      id: "name",
      header: "Product Name",
      icon: <Package className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => (
        <div className="truncate">
          <span className="text-neutral-900 dark:text-white">{r.name}</span>
        </div>
      ),
      tdClassName: "max-w-[280px]",
    },
    {
      id: "units",
      header: "Unit sold",
      icon: <Tag className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" strokeWidth={2.5} />,
      accessor: (r) => (
        <div className="flex w-full items-center justify-between gap-3">
          <span className="tabular-nums">{formatNumber(r.units)}</span>
          {preset !== "custom" && typeof r.deltaPct === "number" && (
            <span
              className={
                "inline-flex min-w-[62px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium " +
                (r.deltaPct > 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30"
                  : r.deltaPct < 0
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300")
              }
            >
              {(r.deltaPct > 0 ? "+" : r.deltaPct < 0 ? "" : "") + r.deltaPct.toFixed(2)}%
            </span>
          )}
        </div>
      ),
      thClassName: "pr-3",
      tdClassName: "pr-3",
    },
  ];

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          <Trophy className="h-4 w-4 text-neutral-500" />
          <span>Best Selling Items</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow-sm dark:bg-neutral-900">
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <span>Filter</span>
          </button>
          <IconCircleButton aria-label="Open detailed view">
            <ExternalLink className="h-4 w-4" />
          </IconCircleButton>
          <Tooltip content="Summary of best selling items for the selected period.">
            {/* <Info className="h-4 w-4" /> */}
            {/* <IconCircleButton aria-label="About table">
              <Info className="h-4 w-4" />
            </IconCircleButton> */}
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

      {/* Table */}
      <DataTable<BestSellingItem>
        columns={columns}
        data={rows}
        showIndex
        getRowId={(r) => r.sku}
      />
    </div>
  );
}
