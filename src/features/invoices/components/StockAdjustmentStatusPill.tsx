"use client";

import type { Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { StockAdjustmentInvoiceStatus } from "../services/stockAdjustmentInvoice.service";
import StatusPill from "./StatusPill";

export const STATUS_ACCENT: Record<StockAdjustmentInvoiceStatus, Accent> = {
  draft: "primary",
  confirmed: "success",
};

type StockAdjustmentStatusPillProps = {
  status: StockAdjustmentInvoiceStatus;
};

export default function StockAdjustmentStatusPill({
  status,
}: StockAdjustmentStatusPillProps) {
  const dict = useDict();
  return (
    <StatusPill
      label={dict[status] ?? status}
      accent={STATUS_ACCENT[status]}
    />
  );
}
