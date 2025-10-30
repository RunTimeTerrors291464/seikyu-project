"use client";

import clsx from "clsx";

type Delta = { value: number; type: "increase" | "decrease" | "neutral" };

export default function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: Delta;
}) {
  const deltaColor =
    delta?.type === "increase"
      ? "text-success"
      : delta?.type === "decrease"
      ? "text-danger"
      : "text-neutral-500";

  const sign = delta && delta.value !== 0 ? (delta.value > 0 ? "+" : "") : "";

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {delta && (
        <div className={clsx("mt-1 text-xs", deltaColor)}>
          {sign}
          {delta.value}%
        </div>
      )}
    </div>
  );
}
