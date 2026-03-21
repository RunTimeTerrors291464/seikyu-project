import apiClient from "@/services/api-client";
import { Product, ProductHistoryDetail, ProductHistoryItem, ProductListResponse, ProductOverview } from "@features/products/types/product";

/* ============================= */
/* GET PRODUCT BY ID */
/* ============================= */

export async function getProductById(id: string) {
  console.log("[ProductService] getProductById → request", { id });

  try {
    const res = await apiClient.get<Product>(`/products/${id}`);

    console.log("[ProductService] getProductById → success", {
      id,
      data: res.data,
    });

    return res.data;
  } catch (error: any) {
    console.error("[ProductService] getProductById → error", {
      id,
      message: error?.message,
      response: error?.response?.data,
    });

    throw error;
  }
}

/* ============================= */
/* UPDATE PRODUCT */
/* ============================= */

export async function updateProduct(
  payload: Partial<Product> & { id: string }
) {

  try {

    const res = await apiClient.patch("/products", payload);

    console.log("[ProductService] updateProduct → success", res.data);

    return res.data;
  } catch (error: any) {
    console.error("[ProductService] updateProduct → error", {
      payload,
      message: error?.message,
      response: error?.response?.data,
    });

    throw error;
  }
}

/* ============================= */
/* PRODUCT QUERY */
/* ============================= */

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

/* ============================= */
/* CLEAN PARAMS */
/* ============================= */

function cleanParams(params: ProductQuery) {
  const cleaned: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  });

  console.log("[ProductService] cleanParams → output", cleaned);

  return cleaned;
}

/* ============================= */
/* PRODUCT LIST */
/* ============================= */

export const productService = {
  async getProducts(params: ProductQuery) {
    console.log("[ProductService] getProducts → request", params);

    try {
      const res = await apiClient.get<ProductListResponse>(
        "/products",
        { params: cleanParams(params) }
      );

      console.log("[ProductService] getProducts → success", {
        total: res.data.total,
        count: res.data.products?.length,
      });

      return res.data;
    } catch (error: any) {
      console.error("[ProductService] getProducts → error", {
        params,
        message: error?.message,
      });

      throw error;
    }
  },
};

/* ============================= */
/* OVERVIEW */
/* ============================= */

export async function getProductOverview(): Promise<ProductOverview> {
  console.log("[ProductService] getProductOverview → request");

  try {
    const res = await apiClient.get<ProductOverview>(
      "/products/overview"
    );

    console.log("[ProductService] getProductOverview → success", res.data);

    return res.data;
  } catch (error: any) {
    console.error("[ProductService] getProductOverview → error", {
      message: error?.message,
      response: error?.response?.data,
    });

    throw error;
  }
}

/* ============================= */
/* HISTORY */
/* ============================= */

export const getProductHistory = async (
  productId: string
): Promise<ProductHistoryItem[]> => {
  console.log("[ProductService] getProductHistory → request", {
    productId,
  });

  try {
    const res = await apiClient.get(
      `/products/history/${productId}`
    );

    console.log("[ProductService] getProductHistory → success", {
      productId,
      count: res.data?.length,
    });

    return res.data;
  } catch (error: any) {
    console.error("[ProductService] getProductHistory → error", {
      productId,
      message: error?.message,
    });

    throw error;
  }
};

export const getProductHistoryDetail = async (
  productId: string,
  version: number
): Promise<ProductHistoryDetail> => {
  console.log("[ProductService] getProductHistoryDetail → request", {
    productId,
    version,
  });

  try {
    const res = await apiClient.get(
      `/products/history/${productId}/${version}`
    );

    console.log("[ProductService] getProductHistoryDetail → success", {
      productId,
      version,
    });

    return res.data;
  } catch (error: any) {
    console.error("[ProductService] getProductHistoryDetail → error", {
      productId,
      version,
      message: error?.message,
    });

    throw error;
  }
};

/* ============================= */
/* ACTIVE DEACTIVE */
/* ============================= */
export const deactivateProduct = async (id: string) => {
  return apiClient.patch(`/products/${id}/deactivate`);
};

export const activateProduct = async (id: string) => {
  return apiClient.patch(`/products/${id}/activate`);
};