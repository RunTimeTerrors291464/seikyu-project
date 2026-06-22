import type { DictionaryLabelKey } from "@/lib/lang/i18n";

import type {
  DashboardInvoiceType,
  ProductRankingDateType,
} from "../services/dashboard.service";

export type DashboardInvoiceTypeFilter = DashboardInvoiceType;

export type ProductRankingDateTypeFilter = ProductRankingDateType;

export const DASHBOARD_INVOICE_TYPE_OPTIONS: readonly {
  value: DashboardInvoiceTypeFilter;
  dictKey: DictionaryLabelKey;
}[] = [
  { value: "selling", dictKey: "dashboardInvoiceTypeSelling" },
  { value: "import", dictKey: "dashboardInvoiceTypeImport" },
  { value: "returnSelling", dictKey: "dashboardInvoiceTypeReturnSelling" },
  { value: "returnImport", dictKey: "dashboardInvoiceTypeReturnImport" },
  { value: "stockAdjustment", dictKey: "dashboardInvoiceTypeStockAdjustment" },
];

export const PRODUCT_RANKING_DATE_TYPE_OPTIONS: readonly {
  value: ProductRankingDateTypeFilter;
  dictKey: DictionaryLabelKey;
}[] = [
  { value: "daily", dictKey: "dashboardDateTypeDaily" },
  { value: "monthly", dictKey: "dashboardDateTypeMonthly" },
  { value: "yearly", dictKey: "dashboardDateTypeYearly" },
  { value: "custom", dictKey: "dashboardDateTypeCustom" },
];
