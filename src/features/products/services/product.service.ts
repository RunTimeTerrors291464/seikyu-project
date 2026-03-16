import api from "@/services/api-client";
import { ProductOverview } from "@features/products/types/product.overview";
import type { ProductListResponse } from "@features/products/types/productApi";

/**
 * Query parameters used for fetching products
 */
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

/**
 * Remove empty query params before sending request
 * This prevents sending useless values like:
 * undefined, null, "", or "all"
 */
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

  // Debug: show cleaned query params
  console.log("PRODUCT SERVICE → cleaned params", cleaned);

  return cleaned;
}

/**
 * Product API Service
 */
export const productService = {
  /**
   * Fetch product list with filters, pagination, and sorting
   */
  async getProducts(params: ProductQuery) {

    // Debug: check what parameters are received
    console.log("PRODUCT SERVICE → getProducts called", params);

    try {

      // Remove empty query parameters
      const query = cleanParams(params);

      // Debug: confirm final query sent to backend
      console.log("PRODUCT SERVICE → sending query", query);

      // Call backend API
      const res = await api.get<ProductListResponse>(
        "/products",
        { params: query }
      );

      // Debug: confirm API response
      console.log("PRODUCT SERVICE → getProducts success", res.data);

      return res.data;

    } catch (error: any) {

      // Debug: show backend error response
      console.error(
        "PRODUCT SERVICE → getProducts failed",
        error.response?.data
      );

      // Re-throw so UI/components can handle it
      throw error;
    }
  }
};

/**
 * Fetch product overview (statistics / dashboard data)
 */
export async function getProductOverview(): Promise<ProductOverview> {

  // Debug: confirm function execution
  console.log("PRODUCT SERVICE → getProductOverview called");

  try {

    // Call backend overview endpoint
    const res = await api.get<ProductOverview>(
      "/products/overview"
    );

    // Debug: show overview data returned
    console.log(
      "PRODUCT SERVICE → getProductOverview success",
      res.data
    );

    return res.data;

  } catch (error: any) {

    // Debug: show error returned from backend
    console.error(
      "PRODUCT SERVICE → getProductOverview failed",
      error.response?.data
    );

    throw error;
  }
}