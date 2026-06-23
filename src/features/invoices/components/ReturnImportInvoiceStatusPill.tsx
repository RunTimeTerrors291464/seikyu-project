"use client";

import type { Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { ReturnImportInvoiceStatus } from "../services/returnImportInvoice.service";
import StatusPill from "./StatusPill";

const STATUS_ACCENT: Record<ReturnImportInvoiceStatus, Accent> = {
  draft: "primary",
  confirmed: "success",
};

type ReturnImportInvoiceStatusPillProps = {
  status: ReturnImportInvoiceStatus;
};

export default function ReturnImportInvoiceStatusPill({
  status,
}: ReturnImportInvoiceStatusPillProps) {
  const dict = useDict();
  return (
    <StatusPill
      label={dict[status] ?? status}
      accent={STATUS_ACCENT[status]}
    />
  );
}
