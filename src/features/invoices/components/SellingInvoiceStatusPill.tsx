"use client";

import type { Accent } from "@/components/types/ui";
import { useDict } from "@/lib/lang/DictProvider";
import type { SellingInvoiceStatus } from "../services/sellingInvoice.service";
import StatusPill from "./StatusPill";

export const SELLING_STATUS_ACCENT: Record<SellingInvoiceStatus, Accent> = {
  confirmed: "success",
  partiallyReturned: "warning",
  returned: "danger",
};

type SellingInvoiceStatusPillProps = {
  status: SellingInvoiceStatus;
};

export default function SellingInvoiceStatusPill({
  status,
}: SellingInvoiceStatusPillProps) {
  const dict = useDict();
  return (
    <StatusPill
      label={dict[status] ?? status}
      accent={SELLING_STATUS_ACCENT[status]}
    />
  );
}
