import type { Dictionary } from "@/lib/lang/i18n";
import type { ImportInvoiceStatus } from "../services/importInvoice.service";

export type ImportInvoiceStatusFilter = "all" | ImportInvoiceStatus;

export const IMPORT_INVOICE_STATUS_OPTIONS: {
  value: ImportInvoiceStatusFilter;
  dictKey: keyof Dictionary;
}[] = [
  {
    value: "all",
    dictKey: "all",
  },
  {
    value: "draft",
    dictKey: "draft",
  },
  {
    value: "confirmed",
    dictKey: "confirmed",
  },
  {
    value: "partiallyReturned",
    dictKey: "partiallyReturned",
  },
  {
    value: "returned",
    dictKey: "returned",
  },
];

