"use client";

import { ACCENT_STYLES, Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import { ImportInvoiceStatus } from "../services/importInvoice.service";

type ImportInvoiceStatusPillProps = {
  status: ImportInvoiceStatus;
};

const STATUS_ACCENT: Record<ImportInvoiceStatus, Accent> = {
  draft: "primary",
  confirmed: "success",
  partiallyReturned: "warning",
  returned: "danger",
};

export { STATUS_ACCENT };

export default function ImportInvoiceStatusPill({
  status,
}: ImportInvoiceStatusPillProps) {
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

