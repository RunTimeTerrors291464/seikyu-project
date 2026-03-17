"use client";

import clsx from "clsx";
import { Clock } from "lucide-react";

export function HeaderMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs",
        "border border-border",
        "bg-bg text-muted",
        "transition-colors duration-150 hover:bg-hover"
      )}
    >
      <Clock className="h-3.5 w-3.5 text-muted" />

      <span>
        <span className="text-muted">{label}:</span>{" "}
        <span className="text-text font-medium">{value}</span>
      </span>
    </div>
  );
}