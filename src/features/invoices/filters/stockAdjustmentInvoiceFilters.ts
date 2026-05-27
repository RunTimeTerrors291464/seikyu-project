import type { StockAdjustmentReasonCategory } from "../services/stockAdjustmentInvoice.service";

export type StockAdjustmentInvoiceStatusFilter = "all" | "draft" | "confirmed";

export const STOCK_ADJUSTMENT_INVOICE_STATUS_OPTIONS: {
  value: StockAdjustmentInvoiceStatusFilter;
  dictKey: "all" | "draft" | "confirmed";
}[] = [
  { value: "all", dictKey: "all" },
  { value: "draft", dictKey: "draft" },
  { value: "confirmed", dictKey: "confirmed" },
];

export const STOCK_ADJUSTMENT_REASON_CATEGORY_OPTIONS: {
  value: StockAdjustmentReasonCategory;
  dictKey: string;
}[] = [
  { value: "damage", dictKey: "reasonCategoryDamage" },
  { value: "expired", dictKey: "reasonCategoryExpired" },
  { value: "shrinkage", dictKey: "reasonCategoryShrinkage" },
  { value: "foundInventory", dictKey: "reasonCategoryFoundInventory" },
  { value: "physicalInventory", dictKey: "reasonCategoryPhysicalInventory" },
  { value: "cycleCountVariance", dictKey: "reasonCategoryCycleCountVariance" },
  { value: "inventoryCorrection", dictKey: "reasonCategoryInventoryCorrection" },
  { value: "obsolescence", dictKey: "reasonCategoryObsolescence" },
  { value: "qualityRejection", dictKey: "reasonCategoryQualityRejection" },
  { value: "recall", dictKey: "reasonCategoryRecall" },
  { value: "receivingVariance", dictKey: "reasonCategoryReceivingVariance" },
  { value: "pickingError", dictKey: "reasonCategoryPickingError" },
  { value: "shippingError", dictKey: "reasonCategoryShippingError" },
  { value: "transferVariance", dictKey: "reasonCategoryTransferVariance" },
  { value: "dataCorrection", dictKey: "reasonCategoryDataCorrection" },
  { value: "other", dictKey: "reasonCategoryOther" },
];
