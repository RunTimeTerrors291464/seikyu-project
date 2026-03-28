import { ProductStockStatus } from "@/features/products/types/product";
import { Dictionary } from "@/lib/lang/i18n";

export const STOCK_STATUS = {
  0: {
    key: "inStock",
    accent: "success" as Accent,
  },
  1: {
    key: "lowStock",
    accent: "warning" as Accent,
  },
  2: {
    key: "outOfStock",
    accent: "danger" as Accent,
  },
} as const;

export type Accent =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "gold";
// | "attention";

export const ACCENT_STYLES = {
  neutral: "border text-text border-border bg-card",
  success: "border text-success border-success bg-success-soft",
  warning: "border text-warning border-warning bg-warning-soft",
  danger: "border text-danger border-danger bg-danger-soft",
  primary: "border text-primary border-primary bg-primary-soft",
  gold: "border text-gold border-gold bg-gold-soft"
};

export const FIELD_KEYS: Record<string, keyof Dictionary> = {
  sku: "sku",
  isActive: "active",
  productDescription: "description",
  reorderThreshold: "reorderThreshold",
  productNames: "productNames",
  sellingPrice: "sellingPrice",
  importPrice: "importPrice",
  productUnit: "unit",
  newProduct: "newProduct"
};

export type Size = "sm" | "md";

export type ProductStockFilter =
  | "all"
  | ProductStockStatus;

export type ProductStatusFilter =
  | "all"
  | true
  | false;


// Helper

export function formatDate(value: string) {
  const date = new Date(value);

  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString();
}