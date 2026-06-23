"use client";

import type { Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { ImportInvoiceStatus } from "../services/importInvoice.service";
import StatusPill from "./StatusPill";

export const STATUS_ACCENT: Record<ImportInvoiceStatus, Accent> = {
  draft: "primary",
  confirmed: "success",
  partiallyReturned: "warning",
  returned: "danger",
};

type ImportInvoiceStatusPillProps = {
  status: ImportInvoiceStatus;
};

export default function ImportInvoiceStatusPill({
  status,
}: ImportInvoiceStatusPillProps) {
  const dict = useDict();
  return (
    <StatusPill
      label={dict[status] ?? status}
      accent={STATUS_ACCENT[status]}
    />
  );
}
