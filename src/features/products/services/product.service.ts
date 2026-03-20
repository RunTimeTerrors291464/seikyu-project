import apiClient from "@/services/api-client";
import { Product, ProductHistoryDetail, ProductHistoryItem, ProductListResponse, ProductOverview } from "@features/products/types/product";
/* ============================= */
/* API CALL */
/* ============================= */

export async function getProductById(id: string) {

  console.log("PRODUCT SERVICE → getProductById", id);

  try {
    const res = await apiClient.get<Product>(
      `/products/${id}`
    );

    console.log("PRODUCT SERVICE → success", res.data);

    return res.data;

  } catch (error: any) {

    console.error(
      "PRODUCT SERVICE → failed",
      error.response?.data
    );

    throw error;
  }
}

/*
  Query parameters used for fetching products
*/
export type ProductQuery = {
  page?: number;
  limit?: number;

  search?: string;
  searchBy?: "sku" | "productName";

  sortBy?:
  | "sku"
  | "productName"
  | "importPrice"
  | "sellingPrice"
  | "createdAt"
  | "updatedAt"
  | "status";

  sortOrder?: "asc" | "desc";

  isActive?: "true" | "false";
  stockStatus?: "0" | "1" | "2";
};

/*
  Remove empty query params before sending request
*/
function cleanParams(params: ProductQuery) {
  const cleaned: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      cleaned[key] = value;
    }
  });

  return cleaned;
}

/*
  Product API Service
*/
export const productService = {
  async getProducts(params: ProductQuery) {
    const res = await apiClient.get<ProductListResponse>(
      "/products",
      { params: cleanParams(params) }
    );

    return res.data;
  },
};

/*
  Fetch product overview (statistics / dashboard data)
*/
export async function getProductOverview(): Promise<ProductOverview> {

  // Debug: confirm function execution
  console.log("PRODUCT SERVICE → getProductOverview called");

  try {

    // Call backend overview endpoint
    const res = await apiClient.get<ProductOverview>(
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

// GET /products/history/{id}
export const getProductHistory = async (
  productId: string
): Promise<ProductHistoryItem[]> => {
  console.log("[API] getProductHistory → request", {
    productId,
    url: `/products/history/${productId}`,
  });

  try {
    const res = await apiClient.get(
      `/products/history/${productId}`
    );

    console.log("[API] getProductHistory → response", {
      status: res.status,
      data: res.data,
    });

    return res.data;
  } catch (error: any) {
    console.error("[API] getProductHistory → error", {
      productId,
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};

// GET /products/history/{id}/{version}
export const getProductHistoryDetail = async (
  productId: string,
  version: number
): Promise<ProductHistoryDetail> => {
  console.log("[API] getProductHistoryDetail → request", {
    productId,
    version,
    url: `/products/history/${productId}/${version}`,
  });

  try {
    const res = await apiClient.get(
      `/products/history/${productId}/${version}`
    );

    console.log("[API] getProductHistoryDetail → response", {
      status: res.status,
      data: res.data,
    });

    return res.data;
  } catch (error: any) {
    console.error("[API] getProductHistoryDetail → error", {
      productId,
      version,
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    throw error;
  }
};