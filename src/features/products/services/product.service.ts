import apiClient from "@/services/api-client";
import {
  CreateProductPayload,
  GetProductHistoryListResponse,
  GetProductStockHistoryResponse,
  Product,
  ProductHistoryDetail,
  ProductListResponse,
  ProductOverview,
} from "@features/products/types/product";

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

export type ProductListSearchBy = "sku" | "productName";

export type ProductListSortBy =
  | "sku"
  | "productName"
  | "productUnitName"
  | "importPrice"
  | "sellingPrice"
  | "stockStatus"
  | "inventoryStock"
  | "createdAt"
  | "updatedAt";

export type ProductIsActiveFilter = "true" | "false" | "all";

/** Stock status filter codes accepted by `GET /products` (`0` in stock, `1` low, `2` out). */
export type ProductStockStatusFilter = 0 | 1 | 2;

export type PaginatedListParams = {
  page?: number;
  limit?: number;
};

export type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: ProductListSearchBy;
  sortBy?: ProductListSortBy;
  sortOrder?: "asc" | "desc";
  isActive?: ProductIsActiveFilter;
  stockStatus?: ProductStockStatusFilter;
};

/* ============================= */
/* CLEAN PARAMS */
/* ============================= */

/**
 * Serializes product list query params for the API (omits empty values; sends stock status as a number).
 *
 * @param params - List filters and pagination.
 * @returns Params object passed to Axios `params`.
 */
function cleanParams(params: ProductQuery): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};

  (Object.entries(params) as [keyof ProductQuery, ProductQuery[keyof ProductQuery]][])
    .forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      if (key === "isActive" && value === "all") {
        cleaned.isActive = value;
        return;
      }

      if (key === "stockStatus") {
        cleaned.stockStatus = value as ProductStockStatusFilter;
        return;
      }

      cleaned[key] = value as string | number;
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

/**
 * Lists products that use a given product unit.
 *
 * @param productUnitId - Product unit UUID.
 * @param params - Optional pagination (`page`, `limit`).
 * @returns Paginated product list for that unit.
 */
export async function getProductsByUnit(
  productUnitId: string,
  params: PaginatedListParams = {},
): Promise<ProductListResponse> {
  const query: Record<string, number> = {};
  if (params.page != null) {
    query.page = params.page;
  }
  if (params.limit != null) {
    query.limit = params.limit;
  }

  const res = await apiClient.get<ProductListResponse>(
    `/products/by-unit/${encodeURIComponent(productUnitId)}`,
    { params: query },
  );

  return res.data;
}

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

/**
 * Fetches paginated audit history for a product.
 *
 * @param productId - Product UUID.
 * @param params - Optional pagination (`page`, `limit`).
 * @returns History list page from the API.
 */
export async function getProductHistory(
  productId: string,
  params: PaginatedListParams = {},
): Promise<GetProductHistoryListResponse> {
  const query: Record<string, number> = {};
  if (params.page != null) {
    query.page = params.page;
  }
  if (params.limit != null) {
    query.limit = params.limit;
  }

  const res = await apiClient.get<GetProductHistoryListResponse>(
    `/products/history/${encodeURIComponent(productId)}`,
    { params: query },
  );

  return res.data;
}

/**
 * Fetches a single product history version (field-level diff or snapshot).
 *
 * @param productId - Product UUID.
 * @param version - History version number.
 * @returns History detail DTO.
 */
export async function getProductHistoryDetail(
  productId: string,
  version: number,
): Promise<ProductHistoryDetail> {
  const res = await apiClient.get<ProductHistoryDetail>(
    `/products/history/${encodeURIComponent(productId)}/${version}`,
  );

  return res.data;
}

/**
 * Fetches paginated inventory stock movement history for a product.
 *
 * @param productId - Product UUID.
 * @param params - Optional pagination (`page`, `limit`).
 * @returns Stock history list page from the API.
 */
export async function getProductStockHistory(
  productId: string,
  params: PaginatedListParams = {},
): Promise<GetProductStockHistoryResponse> {
  const query: Record<string, number> = {};
  if (params.page != null) {
    query.page = params.page;
  }
  if (params.limit != null) {
    query.limit = params.limit;
  }

  const res = await apiClient.get<GetProductStockHistoryResponse>(
    `/products/stock-history/${encodeURIComponent(productId)}`,
    { params: query },
  );

  return res.data;
}

/* ============================= */
/* ACTIVE DEACTIVE */
/* ============================= */
export const deactivateProduct = async (id: string) => {
  const res = await apiClient.patch(`/products/activation/${id}/deactivate`);
  return res.data;
};

export const activateProduct = async (id: string) => {
  const res = await apiClient.patch(`/products/activation/${id}/activate`);
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