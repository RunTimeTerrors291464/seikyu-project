"use client";

import { ReactNode } from "react";

type Accent = "neutral" | "emerald" | "amber" | "red" | "blue";

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: Accent;
};

export default function KpiTile({
  label,
  value,
  sub,
  icon,
  accent = "neutral"
}: Props) {
  const accentStyles = {
    neutral: "",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
    blue: "text-blue-600"
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <span className="text-xs text-muted">
          {label}
        </span>

        {icon}

      </div>

      <div
        className={`mt-2 text-lg font-semibold ${accentStyles[accent]}`}
      >
        {value}
      </div>

      {sub && (
        <div className="text-xs text-muted mt-1">
          {sub}
        </div>
      )}

    </div>
  );
}