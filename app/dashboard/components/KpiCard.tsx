"use client";

import clsx from "clsx";
import { DollarSign, FileText, Info, Package, ShoppingCart } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import { useDashboardDate } from "@/components/dashboard/DashboardDateContext";

type Delta = { value: number; type: "increase" | "decrease" | "neutral" };

export default function KpiCard({
  label,
  value,
  delta,
  helpText,
}: {
  label: string;
  value: string | number;
  delta?: Delta;
  helpText?: string;
}) {
  const { preset } = useDashboardDate();
  const deltaTone =
    delta?.type === "increase"
      ? { text: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" }
      : delta?.type === "decrease"
      ? { text: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/30" }
      : { text: "text-neutral-600 dark:text-neutral-400", bg: "bg-neutral-100 dark:bg-neutral-800" };

  const sign = delta && delta.value !== 0 ? (delta.value > 0 ? "+" : "") : "";

  function IconForLabel() {
    const l = label.toLowerCase();
    if (l.includes("revenue")) return <DollarSign className="h-4 w-4 text-neutral-500" />;
    if (l.includes("import")) return <Package className="h-4 w-4 text-neutral-500" />;
    if (l.includes("sold") || l.includes("sale")) return <ShoppingCart className="h-4 w-4 text-neutral-500" />;
    if (l.includes("invoice")) return <FileText className="h-4 w-4 text-neutral-500" />;
    return <DollarSign className="h-4 w-4 text-neutral-500" />;
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-neutral-900">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <IconForLabel />
          <span>{label}</span>
        </div>
        {helpText ? (
          <Tooltip content={helpText}>
            <button
              type="button"
              aria-label={`About ${label}`}
              className="text-neutral-300 transition-colors hover:text-neutral-500 focus:outline-none"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        ) : (
          <Info className="h-3.5 w-3.5 text-neutral-300" />
        )}
      </div>

      {/* Value + delta */}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-2xl font-semibold text-neutral-900 dark:text-white">{value}</div>
        {delta && preset !== "custom" && (
          <div className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", deltaTone.text, deltaTone.bg)}>
            {sign}
            {delta.value}%
          </div>
        )}
      </div>
    </div>
  );
}
