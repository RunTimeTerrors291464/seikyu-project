import api from "@/services/api-client";
import { ProductOverview } from "@/types/product-overview";
import type { ProductListResponse } from "@features/products/types/productApi";

export type ProductQuery = {
  page?: number;
  limit?: number;

  search?: string;
  searchBy?: "sku" | "productName" | "importPrice" | "sellingPrice";

  sortBy?:
  | "sku"
  | "productName"
  | "unit"
  | "importPrice"
  | "sellingPrice"
  | "createdAt"
  | "updatedAt"
  | "stockStatus";

  sortOrder?: "asc" | "desc";

  active?: "true" | "false" | "all";
  stockStatus?: "0" | "1" | "2" | "all";
};

function cleanParams(params: ProductQuery) {
  const cleaned: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

export const productService = {
  async getProducts(params: ProductQuery) {

    const query = cleanParams(params);

    const res = await api.get<ProductListResponse>(
      "/products",
      { params: query }
    );

    return res.data;
  }
};

export async function getProductOverview(): Promise<ProductOverview> {
  const res = await api.get<ProductOverview>(
    "/products/overview"
  );

  return res.data;
}