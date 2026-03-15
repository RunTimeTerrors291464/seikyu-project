"use client";

import { CheckCircle2, XCircle } from "lucide-react";

type Props = {
  active: boolean;
  label?: string;
};

export default function ActivePill({ active, label }: Props) {
  const tone = active
    ? "bg-emerald-100 text-emerald-700"
    : "bg-neutral-200 text-neutral-700";

  const Icon = active ? CheckCircle2 : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label ?? (active ? "Active" : "Inactive")}
    </span>
  );
}