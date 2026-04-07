"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { SellingInvoiceStatus } from "../services/sellingInvoice.service";

type SellingInvoiceStatusPillProps = {
  status: SellingInvoiceStatus;
};

export const SELLING_STATUS_ACCENT: Record<SellingInvoiceStatus, Accent> = {
  confirmed: "success",
  partiallyReturned: "warning",
  returned: "danger",
};

export default function SellingInvoiceStatusPill({
  status,
}: SellingInvoiceStatusPillProps) {
  const dict = useDict();
  const accent = SELLING_STATUS_ACCENT[status];
  const statusLabel = dict[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACCENT_STYLES[accent]}`}
    >
      {statusLabel}
    </span>
  );
}
