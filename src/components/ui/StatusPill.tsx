"use client";

import type { ProductStatus } from "@/features/products/types/product";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

type Props = {
  status: ProductStatus;
  label?: string;
};

const STATUS_CONFIG = {
  inStock: {
    tone: "bg-success-soft text-success",
    Icon: TrendingUp
  },
  lowStock: {
    tone: "bg-warning-soft text-warning",
    Icon: AlertTriangle
  },
  outOfStock: {
    tone: "bg-danger-soft text-danger",
    Icon: TrendingDown
  }
} as const;

export default function StatusPill({ status, label }: Props) {

  const { tone, Icon } = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
      {label ?? status}
    </span>
  );
}