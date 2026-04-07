import apiClient from "@/services/api-client";

export type ReturnSellingInvoiceStatus = "draft" | "confirmed";

export type ReturnSellingInvoiceProductResponseDto = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  returnQuantity: number;
  sellingPrice: number | string;
  totalReturnPrice: number | string;
  notes: string | null;
};

export type ReturnSellingInvoiceWithoutProductsDto = {
  id: string;
  returnInvoiceId: string | null;
  sellingInvoiceId: string;
  totalProducts: number;
  totalQuantity: number;
  totalReturnPrice: number | string;
  notes: string | null;
  status: ReturnSellingInvoiceStatus;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type ReturnSellingInvoiceResponseDto = {
  id: string;
  returnInvoiceId: string | null;
  sellingInvoiceId: string;
  products: ReturnSellingInvoiceProductResponseDto[];
  totalProducts: number;
  totalQuantity: number;
  totalReturnPrice: number | string;
  notes: string | null;
  status: ReturnSellingInvoiceStatus;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type GetListOfReturnSellingInvoicesResponseDto = {
  page: number;
  limit: number;
  total: number;
  invoices: ReturnSellingInvoiceWithoutProductsDto[];
};

export type ReturnSellingInvoiceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: "returnInvoiceId" | "sellingInvoiceId" | "userId" | "productId";
  sortBy?:
    | "returnInvoiceId"
    | "totalReturnPrice"
    | "createdAt"
    | "confirmedAt";
  sortOrder?: "asc" | "desc";
  status?: ReturnSellingInvoiceStatus;
  fromDate?: string;
  toDate?: string;
};

export type ReturnSellingInvoiceProductRequestDto = {
  productId: string;
  returnQuantity: number;
  notes?: string;
};

export type CreateReturnSellingInvoiceDraftRequestDto = {
  sellingInvoiceId: string;
  products: ReturnSellingInvoiceProductRequestDto[];
  notes?: string;
};

export type EditReturnSellingInvoiceDraftRequestDto = {
  id: string;
  products: ReturnSellingInvoiceProductRequestDto[];
  notes?: string;
};

type ReturnSellingInvoiceListParams = ReturnSellingInvoiceListQuery;

const RETURN_SELLING_LIST_CACHE_TTL_MS = 120_000;

type ReturnSellingListCacheEntry = {
  data: GetListOfReturnSellingInvoicesResponseDto;
  expiresAt: number;
};

const returnSellingInvoiceListCache = new Map<string, ReturnSellingListCacheEntry>();

/**
 * Drops all cached return-selling list responses so the next list fetch hits the API.
 */
export function invalidateReturnSellingInvoiceListCache(): void {
  returnSellingInvoiceListCache.clear();
}

function buildReturnSellingListCacheKey(
  params: ReturnSellingInvoiceListParams,
): string {
  const entries = Object.keys(params)
    .sort()
    .map(function toKeyValue(key) {
      return [key, params[key as keyof ReturnSellingInvoiceListParams]] as const;
    });
  return JSON.stringify(Object.fromEntries(entries));
}

function cleanReturnSellingInvoiceParams(
  params: ReturnSellingInvoiceListParams,
): ReturnSellingInvoiceListParams {
  const cleaned: ReturnSellingInvoiceListParams = {};

  (
    Object.entries(params) as [
      keyof ReturnSellingInvoiceListParams,
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

export async function getReturnSellingInvoiceList(
  params: ReturnSellingInvoiceListQuery,
): Promise<GetListOfReturnSellingInvoicesResponseDto> {
  const cleanedParams = cleanReturnSellingInvoiceParams(params);
  const cacheKey = buildReturnSellingListCacheKey(cleanedParams);
  const now = Date.now();
  const cached = returnSellingInvoiceListCache.get(cacheKey);

  if (cached !== undefined && cached.expiresAt > now) {
    return cached.data;
  }

  const response =
    await apiClient.get<GetListOfReturnSellingInvoicesResponseDto>(
      "/invoices/return-selling",
      {
        params: cleanedParams,
      },
    );

  returnSellingInvoiceListCache.set(cacheKey, {
    data: response.data,
    expiresAt: now + RETURN_SELLING_LIST_CACHE_TTL_MS,
  });

  return response.data;
}

export async function getReturnSellingInvoiceById(
  id: string,
): Promise<ReturnSellingInvoiceResponseDto> {
  const response = await apiClient.get<ReturnSellingInvoiceResponseDto>(
    `/invoices/return-selling/${id}`,
  );

  return response.data;
}

export async function createReturnSellingDraft(
  payload: CreateReturnSellingInvoiceDraftRequestDto,
): Promise<ReturnSellingInvoiceResponseDto> {
  const response = await apiClient.post<ReturnSellingInvoiceResponseDto>(
    "/invoices/return-selling/draft",
    payload,
  );

  invalidateReturnSellingInvoiceListCache();

  return response.data;
}

export async function editReturnSellingDraft(
  payload: EditReturnSellingInvoiceDraftRequestDto,
): Promise<ReturnSellingInvoiceResponseDto> {
  const response = await apiClient.patch<ReturnSellingInvoiceResponseDto>(
    "/invoices/return-selling/draft",
    payload,
  );

  invalidateReturnSellingInvoiceListCache();

  return response.data;
}

export async function deleteReturnSellingDrafts(ids: string[]): Promise<void> {
  await apiClient.delete("/invoices/return-selling/draft", {
    data: { ids },
  });

  invalidateReturnSellingInvoiceListCache();
}

export async function confirmReturnSellingInvoice(
  id: string,
): Promise<ReturnSellingInvoiceResponseDto> {
  const response = await apiClient.patch<ReturnSellingInvoiceResponseDto>(
    `/invoices/return-selling/${id}/confirm`,
  );

  invalidateReturnSellingInvoiceListCache();

  return response.data;
}
