"use client";

import Tooltip from "@/components/ui/ToolTips";
import clsx from "clsx";
import { Info } from "lucide-react";
import { ReactNode } from "react";
import { Accent } from "../types/ui";


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
  helpText,
}: Props) {

  /* ───────── Accent (SYSTEM TOKENS) ───────── */

  const accentStyles = {
    neutral: "text-text",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    primary: "text-primary",
  };

  /* ───────── Delta ───────── */

  const deltaStyles = {
    increase:
      "text-success bg-success",

    decrease:
      "text-danger bg-danger",

    neutral:
      "text-muted bg-hover",
  };

  return (

    <div
      className={clsx(
        "rounded-lg border border-border bg-card p-4",
        "transition-all duration-150",
        "hover:bg-hover"
      )}
    >

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2 text-xs text-muted">

          {icon && <span className="text-text">{icon}</span>}

          <span className="text-text">{label}</span>

        </div>

        {helpText && (

          <Tooltip content={helpText}>
            <Info className="h-3.5 w-3.5" />
          </Tooltip>

        )}

      </div>

      {/* VALUE */}

      <div className="flex items-center justify-between">

        <div
          className={clsx(
            "mt-1 text-2xl font-semibold",
            accentStyles[accent]
          )}
        >
          {value}
        </div>

        {delta && (

          <div
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              deltaStyles[delta.type]
            )}
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