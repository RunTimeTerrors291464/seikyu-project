import type { Dictionary } from "@/lib/lang/i18n";
import type { SellingInvoiceStatus } from "../services/sellingInvoice.service";

export type SellingInvoiceStatusFilter = "all" | SellingInvoiceStatus;

export const SELLING_INVOICE_STATUS_OPTIONS: {
  value: SellingInvoiceStatusFilter;
  dictKey: keyof Dictionary;
}[] = [
  {
    value: "all",
    dictKey: "all",
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
