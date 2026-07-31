import { cleanInvoiceListParams } from "@/lib/datetime/cleanInvoiceListParams";
import { mergeDefaultListDateRange } from "@/lib/datetime/listDateRange";
import { clearProductSkuLookupCache } from "@/features/products/services/product.service";
import apiClient from "@/services/api-client";

export type SellingInvoiceStatus =
  | "confirmed"
  | "partiallyReturned"
  | "returned";

export type SellingInvoiceListSortBy =
  | "invoiceId"
  | "totalProducts"
  | "totalQuantity"
  | "totalSellingPrice"
  | "status"
  | "returnCount"
  | "confirmedAt"
  | "createdAt";

export type SellingInvoiceWithoutProductsDto = {
  id: string;
  invoiceId: string | null;
  totalProducts: number;
  totalQuantity: number;
  invoiceDiscount: number;
  totalSellingPrice: number;
  notes: string | null;
  status: SellingInvoiceStatus;
  returnCount: number;
  taxFocus: boolean;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type SellingInvoiceProductDto = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: number;
  returnQuantity: number;
  sellingPrice: number;
  productDiscount: number;
  totalSellingPrice: number;
  notes: string | null;
};

export type SellingInvoiceResponseDto = {
  id: string;
  invoiceId: string | null;
  products: SellingInvoiceProductDto[];
  totalProducts: number;
  totalQuantity: number;
  invoiceDiscount: number;
  totalSellingPrice: number;
  notes: string | null;
  status: SellingInvoiceStatus;
  returnCount: number;
  taxFocus: boolean;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type GetListOfSellingInvoicesResponseDto = {
  page: number;
  limit: number;
  total: number;
  invoices: SellingInvoiceWithoutProductsDto[];
};

export type SellingInvoiceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: "invoiceId" | "userId" | "productId";
  sortBy?: SellingInvoiceListSortBy;
  sortOrder?: "asc" | "desc";
  status?: SellingInvoiceStatus;
  /** Query string `true` or `false`; omit to include all. */
  taxFocus?: "true" | "false";
  fromDate?: string;
  toDate?: string;
};

export type SellingInvoiceProductLineRequestDto = {
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: number;
  sellingPrice: number;
  productDiscount: number;
  notes?: string;
};

export type CreateSellingInvoiceRequestDto = {
  products: SellingInvoiceProductLineRequestDto[];
  invoiceDiscount?: number;
  notes?: string;
  taxFocus?: boolean;
};

export async function getSellingInvoiceList(
  params: SellingInvoiceListQuery,
): Promise<GetListOfSellingInvoicesResponseDto> {
  const paramsWithDates = mergeDefaultListDateRange(params);
  const cleanedParams = cleanInvoiceListParams(paramsWithDates);

  const response = await apiClient.get<GetListOfSellingInvoicesResponseDto>(
    "/invoices/selling",
    {
      params: cleanedParams,
    },
  );

  return response.data;
}

export async function getSellingInvoiceById(
  id: string,
): Promise<SellingInvoiceResponseDto> {
  const response = await apiClient.get<SellingInvoiceResponseDto>(
    `/invoices/selling/${id}`,
  );

  return response.data;
}

export async function createSellingInvoice(
  payload: CreateSellingInvoiceRequestDto,
): Promise<SellingInvoiceResponseDto> {
  const response = await apiClient.post<SellingInvoiceResponseDto>(
    "/invoices/selling",
    payload,
  );

  clearProductSkuLookupCache();
  return response.data;
}

export async function deleteSellingInvoices(ids: string[]): Promise<void> {
  await apiClient.delete("/invoices/selling", {
    data: { ids },
  });

  clearProductSkuLookupCache();
}
