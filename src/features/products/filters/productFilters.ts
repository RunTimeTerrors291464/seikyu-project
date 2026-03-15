import { Dictionary } from "@/lib/lang/i18n";
import { booleanFilter, equalsFilter, textFilter } from "@/lib/table/filter";
import { Product, ProductStatus } from "../types/product";

export type ProductStockStatus =
  | "all"
  | "0"
  | "1"
  | "2";

export const PRODUCT_STOCK_STATUS_OPTIONS: {
  value: ProductStockStatus;
  dictKey: keyof Dictionary;
}[] = [
    {
      value: "all",
      dictKey: "all"
    },
    {
      value: "0",
      dictKey: "inStock"
    },
    {
      value: "1",
      dictKey: "lowStock"
    },
    {
      value: "2",
      dictKey: "outOfStock"
    }
  ];
export function filterProducts(
  products: Product[],
  search: string,
  searchRule: string,
  statusFilter: ProductStatus | "all",
  activeFilter: "all" | "active" | "inactive"
) {
  return products.filter((p) => {

    if (search) {
      const value =
        searchRule === "SKU"
          ? p.sku
          : p.names?.[0]?.name ?? "";

      if (!textFilter(value, search)) return false;
    }

    if (!equalsFilter(p.status, statusFilter))
      return false;

    if (!booleanFilter(p.is_active, activeFilter))
      return false;

    return true;
  });
}