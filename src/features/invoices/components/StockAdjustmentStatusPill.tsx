"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { StockAdjustmentInvoiceStatus } from "../services/stockAdjustmentInvoice.service";

type StockAdjustmentStatusPillProps = {
  status: StockAdjustmentInvoiceStatus;
};

const STATUS_ACCENT: Record<StockAdjustmentInvoiceStatus, Accent> = {
  draft: "primary",
  confirmed: "success",
};

export { STATUS_ACCENT };

export default function StockAdjustmentStatusPill({
  status,
}: StockAdjustmentStatusPillProps) {
  const dict = useDict();
  const accent = STATUS_ACCENT[status];
  const statusLabel = dict[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACCENT_STYLES[accent]}`}
    >
      {statusLabel}
    </span>
  );
}
