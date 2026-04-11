import type { StockAdjustmentActionReason } from "../services/stockAdjustmentInvoice.service";

export type StockAdjustmentInvoiceStatusFilter = "all" | "draft" | "confirmed";

export const STOCK_ADJUSTMENT_INVOICE_STATUS_OPTIONS: {
  value: StockAdjustmentInvoiceStatusFilter;
  dictKey: "all" | "draft" | "confirmed";
}[] = [
  { value: "all", dictKey: "all" },
  { value: "draft", dictKey: "draft" },
  { value: "confirmed", dictKey: "confirmed" },
];

export const STOCK_ADJUSTMENT_ACTION_REASON_OPTIONS: {
  value: StockAdjustmentActionReason | "all";
  dictKey: string;
}[] = [
  { value: "all", dictKey: "all" },
  { value: "damagedGoods", dictKey: "actionReasonDamagedGoods" },
  { value: "expiredGoods", dictKey: "actionReasonExpiredGoods" },
  { value: "lostGoods", dictKey: "actionReasonLostGoods" },
  { value: "theft", dictKey: "actionReasonTheft" },
  { value: "sampleUsage", dictKey: "actionReasonSampleUsage" },
  { value: "internalUse", dictKey: "actionReasonInternalUse" },
  { value: "foundGoods", dictKey: "actionReasonFoundGoods" },
  { value: "supplierBonus", dictKey: "actionReasonSupplierBonus" },
  { value: "returnedGoods", dictKey: "actionReasonReturnedGoods" },
  { value: "periodicInventoryCheck", dictKey: "actionReasonPeriodicInventoryCheck" },
  { value: "other", dictKey: "actionReasonOther" },
];
