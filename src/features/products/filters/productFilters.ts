import { ProductStatusFilter, ProductStockFilter } from "@/components/types/ui";
import { Dictionary } from "@/lib/lang/i18n";
import { booleanFilter, textFilter } from "@/lib/table/filter";
import { Product } from "../types/product";

export const PRODUCT_STOCK_STATUS_OPTIONS: {
  value: ProductStockFilter;
  dictKey: keyof Dictionary;
}[] = [
    {
      value: "all",
      dictKey: "all",
    },
    {
      value: 0,
      dictKey: "inStock",
    },
    {
      value: 1,
      dictKey: "lowStock",
    },
    {
      value: 2,
      dictKey: "outOfStock",
    },
  ];

export const PRODUCT_STATUS_OPTIONS: {
  value: ProductStatusFilter;
  dictKey: keyof Dictionary;
}[] = [
    {
      value: "all",
      dictKey: "all",
    },
    {
      value: true,
      dictKey: "active",
    },
    {
      value: false,
      dictKey: "inactive",
    },
  ];

export function filterProducts(
  products: Product[],
  search: string,
  searchRule: string,
  stockFilter: ProductStockFilter,
  activeFilter: "all" | "active" | "inactive"
) {
  return products.filter((p) => {

    /* SEARCH */
    if (search) {
      const value =
        searchRule === "SKU"
          ? p.sku
          : p.productNames.join(" ");

      if (!textFilter(value, search)) return false;
    }

    /* STOCK STATUS */
    if (
      stockFilter !== "all" &&
      p.stockStatus !== stockFilter
    ) {
      return false;
    }

    /* ACTIVE */
    if (!booleanFilter(p.isActive, activeFilter)) {
      return false;
    }

    return true;
  });
}
