"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { ReturnImportInvoiceStatus } from "../services/returnImportInvoice.service";

type ReturnImportInvoiceStatusPillProps = {
  status: ReturnImportInvoiceStatus;
};

const STATUS_ACCENT: Record<ReturnImportInvoiceStatus, Accent> = {
  draft: "primary",
  confirmed: "success",
};

export default function ReturnImportInvoiceStatusPill({
  status,
}: ReturnImportInvoiceStatusPillProps) {
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
