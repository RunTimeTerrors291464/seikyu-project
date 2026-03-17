"use client";

import clsx from "clsx";
import { CheckCircle2, XCircle } from "lucide-react";

type Props = {
  active: boolean;
  label?: string;
};

export default function ActivePill({ active, label }: Props) {
  const Icon = active ? CheckCircle2 : XCircle;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors duration-150",
        active
          ? "bg-success/15 text-success"
          : "bg-hover text-muted"
      )}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label ?? (active ? "Active" : "Inactive")}
    </span>
  );
}