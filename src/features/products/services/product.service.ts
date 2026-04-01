import apiClient from "@/services/api-client";
import { CreateProductPayload, Product, ProductHistoryDetail, ProductHistoryItem, ProductListResponse, ProductOverview } from "@features/products/types/product";

type ApiErrorLike = {
  message?: string;
  response?: {
    data?: unknown;
    status?: number;
  };
};

function toApiErrorLike(error: unknown): ApiErrorLike {
  if (typeof error === "object" && error !== null) {
    return error as ApiErrorLike;
  }

  return {};
}

/* ============================= */
/* GET PRODUCT BY ID */
/* ============================= */

export async function getProductById(id: string) {
  try {
    const res = await apiClient.get<Product>(`/products/${id}`);

    return res.data;
  } catch (error: unknown) {
    throw error;
  }
}

/* ============================= */
/* GET PRODUCT BY SKU */
/* ============================= */
export async function getProductBySku(sku: string) {
  try {
    const res = await apiClient.get(`/products/sku/${sku}`);

    return res.data;
  } catch (error: unknown) {
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

    return res.data;
  } catch (error: unknown) {
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
  | "productUnitName"
  | "productName"
  | "importPrice"
  | "sellingPrice"
  | "createdAt"
  | "updatedAt"
  | "status";
  sortOrder?: "asc" | "desc";
  isActive: "true" | "false" | "all";
  stockStatus: "0" | "1" | "2" | "all";
};

/* ============================= */
/* CLEAN PARAMS */
/* ============================= */

function cleanParams(params: ProductQuery) {
  const cleaned: Partial<ProductQuery> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key as keyof ProductQuery] = value as never;
    }
  });

  return cleaned;
}

/* ============================= */
/* PRODUCT LIST */
/* ============================= */

export const productService = {
  async getProducts(params: ProductQuery) {
    try {
      const res = await apiClient.get<ProductListResponse>(
        "/products",
        { params: cleanParams(params) }
      );

      return res.data;
    } catch (error: unknown) {
      throw error;
    }
  },
};

/* ============================= */
/* OVERVIEW */
/* ============================= */

export async function getProductOverview(): Promise<ProductOverview> {
  try {
    const res = await apiClient.get<ProductOverview>(
      "/products/overview"
    );

    return res.data;
  } catch (error: unknown) {
    throw error;
  }
}

/* ============================= */
/* HISTORY */
/* ============================= */

export const getProductHistory = async (
  productId: string
): Promise<ProductHistoryItem[]> => {
  try {
    const res = await apiClient.get(
      `/products/history/${productId}`
    );

    return res.data;
  } catch (error: unknown) {
    throw error;
  }
};

export const getProductHistoryDetail = async (
  productId: string,
  version: number
): Promise<ProductHistoryDetail> => {
  try {
    const res = await apiClient.get(
      `/products/history/${productId}/${version}`
    );

    return res.data;
  } catch (error: unknown) {
    throw error;
  }
};

/* ============================= */
/* ACTIVE DEACTIVE */
/* ============================= */
export const deactivateProduct = async (id: string) => {
  const res = await apiClient.patch(`/products/${id}/deactivate`);
  return res.data;
};

export const activateProduct = async (id: string) => {
  const res = await apiClient.patch(`/products/${id}/activate`);
  return res.data;
};

/* ============================= */
/* CREATE / ADD */
/* ============================= */
export async function createProduct(payload: CreateProductPayload) {
  try {
    const res = await apiClient.post("/products", payload);

    return res.data;
  } catch (error: unknown) {
    throw error;
  }
}