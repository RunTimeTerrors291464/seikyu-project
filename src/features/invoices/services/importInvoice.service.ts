import { cleanInvoiceListParams } from "@/lib/datetime/cleanInvoiceListParams";
import { mergeDefaultListDateRange } from "@/lib/datetime/listDateRange";
import { clearProductSkuLookupCache } from "@/features/products/services/product.service";
import apiClient from "@/services/api-client";

export type ImportInvoiceStatus =
  | "draft"
  | "confirmed"
  | "partiallyReturned"
  | "returned";

export type ImportInvoiceListSortBy =
  | "invoiceId"
  | "totalProducts"
  | "totalQuantity"
  | "totalImportPrice"
  | "status"
  | "returnCount"
  | "draftAt"
  | "confirmedAt"
  | "createdAt";

export type ImportInvoiceWithoutProductsDto = {
  id: string;
  invoiceId: string | null;
  totalProducts: number;
  totalQuantity: number;
  totalImportPrice: number | string;
  notes: string | null;
  status: ImportInvoiceStatus;
  returnCount: number;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type ImportInvoiceProductDto = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: number;
  returnedQuantity: number;
  importPrice: number | string;
  totalImportPrice: number | string;
  notes: string | null;
};

export type ImportInvoiceResponseDto = {
  id: string;
  invoiceId: string | null;
  products: ImportInvoiceProductDto[];
  totalProducts: number;
  totalQuantity: number;
  totalImportPrice: number | string;
  notes: string | null;
  status: ImportInvoiceStatus;
  returnCount: number;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type GetListOfImportInvoicesResponseDto = {
  page: number;
  limit: number;
  total: number;
  invoices: ImportInvoiceWithoutProductsDto[];
};

export type ImportInvoiceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: "invoiceId" | "userId" | "productId";
  sortBy?: ImportInvoiceListSortBy;
  sortOrder?: "asc" | "desc";
  status?: ImportInvoiceStatus;
  fromDate?: string;
  toDate?: string;
};

export type ImportInvoiceProductRequestDto = {
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: number;
  importPrice: number;
  notes?: string;
};

export type EditImportInvoiceRequestDto = {
  id: string;
  products: ImportInvoiceProductRequestDto[];
  notes?: string;
};

export type CreateImportInvoiceRequestDto = {
  products: ImportInvoiceProductRequestDto[];
  notes?: string;
};

/**
 * Coerces API money fields that may be returned as strings (e.g. `"3121.00"`).
 *
 * @param value - Numeric or string amount from the API.
 * @returns Finite number, or 0 when unparsable.
 */
export function parseImportInvoiceMoney(value: number | string): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function getImportInvoiceList(
  params: ImportInvoiceListQuery,
): Promise<GetListOfImportInvoicesResponseDto> {
  const paramsWithDates = mergeDefaultListDateRange(params);
  const cleanedParams = cleanInvoiceListParams(paramsWithDates);

  const response = await apiClient.get<GetListOfImportInvoicesResponseDto>(
    "/invoices/import",
    {
      params: cleanedParams,
    },
  );

  return response.data;
}

export async function getImportInvoiceById(
  id: string,
): Promise<ImportInvoiceResponseDto> {
  const response = await apiClient.get<ImportInvoiceResponseDto>(
    `/invoices/import/${id}`,
  );

  return response.data;
}

export async function editImportInvoiceDraft(
  payload: EditImportInvoiceRequestDto,
): Promise<ImportInvoiceResponseDto> {
  const response = await apiClient.patch<ImportInvoiceResponseDto>(
    "/invoices/import",
    payload,
  );

  clearProductSkuLookupCache();
  return response.data;
}

export async function createImportInvoiceDraft(
  payload: CreateImportInvoiceRequestDto,
): Promise<ImportInvoiceResponseDto> {
  const response = await apiClient.post<ImportInvoiceResponseDto>(
    "/invoices/import",
    payload,
  );

  clearProductSkuLookupCache();
  return response.data;
}

export async function confirmImportInvoice(
  id: string,
): Promise<ImportInvoiceResponseDto> {
  const response = await apiClient.post<ImportInvoiceResponseDto>(
    `/invoices/import/${id}/confirm`,
  );

  clearProductSkuLookupCache();
  return response.data;
}

export async function deleteImportInvoices(
  ids: string[],
): Promise<void> {
  await apiClient.delete("/invoices/import", {
    data: { ids },
  });
  clearProductSkuLookupCache();
}

/** Backward-compatible detail-page name; the endpoint now accepts every invoice status. */
export const deleteImportInvoiceDrafts = deleteImportInvoices;
