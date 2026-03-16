"use client";

import Tooltip from "@/components/ui/ToolTips";
import { Info } from "lucide-react";
import { ReactNode } from "react";

type Accent =
  | "neutral"
  | "emerald"
  | "amber"
  | "red"
  | "blue";

type Delta = {
  value: number;
  type: "increase" | "decrease" | "neutral";
};

type Props = {
  label: string;
  value: string | number;

  sub?: string;
  icon?: ReactNode;

  accent?: Accent;

  delta?: Delta;

  helpText?: string;
};

export default function KpiTile({
  label,
  value,
  sub,
  icon,
  accent = "neutral",
  delta,
  helpText
}: Props) {

  const accentStyles = {
    neutral: "",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    blue: "text-blue-600"
  };

  const deltaStyles = {
    increase:
      "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",

    decrease:
      "text-red-600 bg-red-50 dark:bg-red-900/20",

    neutral:
      "text-muted bg-muted/20"
  };

  return (

    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2 text-xs text-muted">

          {icon}

          <span>{label}</span>

        </div>

        {helpText && (

          <Tooltip content={helpText}>

            <button
              type="button"
              className="text-muted hover:text-text"
            >
              <Info className="h-3.5 w-3.5" />
            </button>

          </Tooltip>

        )}

      </div>

      {/* VALUE */}

      <div className="mt-2 flex items-center justify-between">

        <div
          className={`text-lg font-semibold ${accentStyles[accent]}`}
        >
          {value}
        </div>

        {delta && (

          <div
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${deltaStyles[delta.type]}`}
          >
            {delta.value > 0 ? "+" : ""}
            {delta.value}%
          </div>

        )}

      </div>

      {/* SUBTEXT */}

      {sub && (

        <div className="mt-1 text-xs text-muted">
          {sub}
        </div>

      )}

    </div>

  );
}