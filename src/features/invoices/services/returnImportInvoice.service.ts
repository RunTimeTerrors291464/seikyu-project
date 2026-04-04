import apiClient from "@/services/api-client";

export type ReturnImportInvoiceStatus = "draft" | "confirmed";

export type ReturnImportInvoiceProductResponseDto = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  returnQuantity: number;
  importPrice: number | string;
  totalReturnPrice: number | string;
  notes: string | null;
};

export type ReturnImportInvoiceWithoutProductsDto = {
  id: string;
  returnInvoiceId: string | null;
  importInvoiceId: string;
  totalProducts: number;
  totalQuantity: number;
  totalReturnPrice: number | string;
  notes: string | null;
  status: ReturnImportInvoiceStatus;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type ReturnImportInvoiceResponseDto = {
  id: string;
  returnInvoiceId: string | null;
  importInvoiceId: string;
  products: ReturnImportInvoiceProductResponseDto[];
  totalProducts: number;
  totalQuantity: number;
  totalReturnPrice: number | string;
  notes: string | null;
  status: ReturnImportInvoiceStatus;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type GetListOfReturnImportInvoicesResponseDto = {
  page: number;
  limit: number;
  total: number;
  invoices: ReturnImportInvoiceWithoutProductsDto[];
};

export type ReturnImportInvoiceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: "returnInvoiceId" | "importInvoiceId" | "userId" | "productId";
  sortBy?: "returnInvoiceId" | "totalReturnPrice" | "createdAt";
  sortOrder?: "asc" | "desc";
  status?: ReturnImportInvoiceStatus;
  fromDate?: string;
  toDate?: string;
};

export type ReturnImportInvoiceProductRequestDto = {
  productId: string;
  returnQuantity: number;
  notes?: string;
};

export type CreateReturnImportInvoiceDraftRequestDto = {
  importInvoiceId: string;
  products: ReturnImportInvoiceProductRequestDto[];
  notes?: string;
};

export type EditReturnImportInvoiceDraftRequestDto = {
  id: string;
  products: ReturnImportInvoiceProductRequestDto[];
  notes?: string;
};

type ReturnImportInvoiceListParams = ReturnImportInvoiceListQuery;

const RETURN_IMPORT_LIST_CACHE_TTL_MS = 120_000;

type ReturnImportListCacheEntry = {
  data: GetListOfReturnImportInvoicesResponseDto;
  expiresAt: number;
};

const returnImportInvoiceListCache = new Map<string, ReturnImportListCacheEntry>();

/**
 * Drops all cached return-import list responses so the next list fetch hits the API.
 */
export function invalidateReturnImportInvoiceListCache(): void {
  returnImportInvoiceListCache.clear();
}

/**
 * Builds a stable cache key from list query params (same logical query → same key).
 *
 * @param params - Cleaned query object from `cleanReturnImportInvoiceParams`.
 * @returns JSON string of params with sorted keys.
 */
function buildReturnImportListCacheKey(
  params: ReturnImportInvoiceListParams,
): string {
  const entries = Object.keys(params)
    .sort()
    .map(function toKeyValue(key) {
      return [key, params[key as keyof ReturnImportInvoiceListParams]] as const;
    });
  return JSON.stringify(Object.fromEntries(entries));
}

function cleanReturnImportInvoiceParams(
  params: ReturnImportInvoiceListParams,
): ReturnImportInvoiceListParams {
  const cleaned: ReturnImportInvoiceListParams = {};

  (
    Object.entries(params) as [
      keyof ReturnImportInvoiceListParams,
      string | number | undefined,
    ][]
  ).forEach(function filterParam([key, value]): void {
    if (value === undefined || value === null || value === "") {
      return;
    }

    cleaned[key] = value as never;
  });

  return cleaned;
}

/**
 * Lists return import invoices. Results are cached in-memory per query for a short TTL.
 *
 * @param params - Optional filters, pagination, and sort for the list endpoint.
 * @returns Paginated list payload from the API (possibly from cache).
 */
export async function getReturnImportInvoiceList(
  params: ReturnImportInvoiceListQuery,
): Promise<GetListOfReturnImportInvoicesResponseDto> {
  const cleanedParams = cleanReturnImportInvoiceParams(params);
  const cacheKey = buildReturnImportListCacheKey(cleanedParams);
  const now = Date.now();
  const cached = returnImportInvoiceListCache.get(cacheKey);

  if (cached !== undefined && cached.expiresAt > now) {
    return cached.data;
  }

  const response = await apiClient.get<GetListOfReturnImportInvoicesResponseDto>(
    "/invoices/return-import",
    {
      params: cleanedParams,
    },
  );

  returnImportInvoiceListCache.set(cacheKey, {
    data: response.data,
    expiresAt: now + RETURN_IMPORT_LIST_CACHE_TTL_MS,
  });

  return response.data;
}

export async function getReturnImportInvoiceById(
  id: string,
): Promise<ReturnImportInvoiceResponseDto> {
  const response = await apiClient.get<ReturnImportInvoiceResponseDto>(
    `/invoices/return-import/${id}`,
  );

  return response.data;
}

export async function createReturnImportDraft(
  payload: CreateReturnImportInvoiceDraftRequestDto,
): Promise<ReturnImportInvoiceResponseDto> {
  const response = await apiClient.post<ReturnImportInvoiceResponseDto>(
    "/invoices/return-import/draft",
    payload,
  );

  invalidateReturnImportInvoiceListCache();

  return response.data;
}

export async function editReturnImportDraft(
  payload: EditReturnImportInvoiceDraftRequestDto,
): Promise<ReturnImportInvoiceResponseDto> {
  const response = await apiClient.patch<ReturnImportInvoiceResponseDto>(
    "/invoices/return-import/draft",
    payload,
  );

  invalidateReturnImportInvoiceListCache();

  return response.data;
}

export async function deleteReturnImportDrafts(ids: string[]): Promise<void> {
  await apiClient.delete("/invoices/return-import/draft", {
    data: { ids },
  });

  invalidateReturnImportInvoiceListCache();
}

export async function confirmReturnImportInvoice(
  id: string,
): Promise<ReturnImportInvoiceResponseDto> {
  const response = await apiClient.patch<ReturnImportInvoiceResponseDto>(
    `/invoices/return-import/${id}/confirm`,
  );

  invalidateReturnImportInvoiceListCache();

  return response.data;
}
