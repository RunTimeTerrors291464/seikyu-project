"use client";

import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import IconPill from "@/components/ui/IconPill";
import type { ProductStockStatus } from "@/features/products/types/product";
import { useDict } from "@/lib/lang/DictProvider";

/* ============================= */
/* CONFIG */
/* ============================= */

const STATUS_CONFIG = {
  0: {
    accent: "success",
    Icon: TrendingUp,
    dictKey: "inStock",
  },
  1: {
    accent: "warning",
    Icon: AlertTriangle,
    dictKey: "lowStock",
  },
  2: {
    accent: "danger",
    Icon: TrendingDown,
    dictKey: "outOfStock",
  },
} as const;

/* ============================= */
/* COMPONENT */
/* ============================= */

type Props = {
  status: ProductStockStatus;
};

export default function StatusPill({
  status,
}: Props) {
  const dict = useDict();

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const { accent, Icon, dictKey } = config;

  return (
    <IconPill
      icon={Icon}
      accent={accent}
      label={dict[dictKey]}
    />
  );
}