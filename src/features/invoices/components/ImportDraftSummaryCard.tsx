"use client";

import { Accent } from "@/components/types/ui";
import clsx from "clsx";
import { type ReactNode } from "react";

export type ImportDraftSummaryRow = {
  label: string;
  value: string;
  accent: Accent;
};

type ImportDraftSummaryCardProps = {
  rows: ImportDraftSummaryRow[];
};

const accentTextStyles: Record<Accent, string> = {
  neutral: "text-text",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  primary: "text-primary",
  gold: "text-gold",
};

export default function ImportDraftSummaryCard({ rows }: ImportDraftSummaryCardProps) {
  return (
    <div className="w-full max-w-xs shrink-0 rounded-lg border border-border bg-card p-4">
      <dl className="space-y-2.5">
        {rows.map(function renderSummaryRow(row): ReactNode {
          return (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <dt className="text-muted">{row.label}</dt>
              <dd
                className={clsx(
                  "shrink-0 font-semibold tabular-nums",
                  accentTextStyles[row.accent],
                )}
              >
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
