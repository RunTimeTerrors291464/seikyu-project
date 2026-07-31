import { cleanInvoiceListParams } from "@/lib/datetime/cleanInvoiceListParams";
import { mergeDefaultListDateRange } from "@/lib/datetime/listDateRange";
import { clearProductSkuLookupCache } from "@/features/products/services/product.service";
import apiClient from "@/services/api-client";

export type StockAdjustmentInvoiceStatus = "draft" | "confirmed";

export type StockAdjustmentAction = "add" | "subtract";

export type StockAdjustmentReasonCategory =
  | "cycleCountVariance"
  | "physicalInventory"
  | "inventoryCorrection"
  | "damage"
  | "expired"
  | "shrinkage"
  | "obsolescence"
  | "qualityRejection"
  | "recall"
  | "receivingVariance"
  | "pickingError"
  | "shippingError"
  | "transferVariance"
  | "foundInventory"
  | "dataCorrection"
  | "other";

export type StockAdjustmentInvoiceProductDto = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  action: StockAdjustmentAction;
  quantity: number;
  reasonCategory: StockAdjustmentReasonCategory;
  reasonNotes: string | null;
  notes: string | null;
};

export type StockAdjustmentInvoiceResponseDto = {
  id: string;
  invoiceId: string | null;
  products: StockAdjustmentInvoiceProductDto[];
  totalProducts: number;
  totalQuantity: number;
  notes: string | null;
  status: StockAdjustmentInvoiceStatus;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type StockAdjustmentInvoiceWithoutProductsDto = {
  id: string;
  invoiceId: string | null;
  totalProducts: number;
  totalQuantity: number;
  notes: string | null;
  status: StockAdjustmentInvoiceStatus;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type GetListOfStockAdjustmentInvoicesResponseDto = {
  page: number;
  limit: number;
  total: number;
  invoices: StockAdjustmentInvoiceWithoutProductsDto[];
};

export type StockAdjustmentInvoiceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: "invoiceId" | "userId" | "productId";
  sortBy?: "invoiceId" | "totalQuantity" | "createdAt" | "confirmedAt";
  sortOrder?: "asc" | "desc";
  status?: StockAdjustmentInvoiceStatus;
  fromDate?: string;
  toDate?: string;
};

export type StockAdjustmentProductRequestDto = {
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  action: StockAdjustmentAction;
  quantity: number;
  reasonCategory: StockAdjustmentReasonCategory;
  reasonNotes?: string;
  notes?: string;
};

export type CreateStockAdjustmentInvoiceRequestDto = {
  products: StockAdjustmentProductRequestDto[];
  notes?: string;
};

export type EditStockAdjustmentInvoiceRequestDto = {
  id: string;
  products: StockAdjustmentProductRequestDto[];
  notes?: string;
};

export async function getStockAdjustmentInvoiceList(
  params: StockAdjustmentInvoiceListQuery,
): Promise<GetListOfStockAdjustmentInvoicesResponseDto> {
  const paramsWithDates = mergeDefaultListDateRange(params);
  const cleanedParams = cleanInvoiceListParams(paramsWithDates);

  const response = await apiClient.get<GetListOfStockAdjustmentInvoicesResponseDto>(
    "/invoices/stock-adjustment",
    {
      params: cleanedParams,
    },
  );

  return response.data;
}

export async function getStockAdjustmentInvoiceById(
  id: string,
): Promise<StockAdjustmentInvoiceResponseDto> {
  const response = await apiClient.get<StockAdjustmentInvoiceResponseDto>(
    `/invoices/stock-adjustment/${id}`,
  );

  return response.data;
}

export async function editStockAdjustmentInvoiceDraft(
  payload: EditStockAdjustmentInvoiceRequestDto,
): Promise<StockAdjustmentInvoiceResponseDto> {
  const response = await apiClient.patch<StockAdjustmentInvoiceResponseDto>(
    "/invoices/stock-adjustment",
    payload,
  );

  clearProductSkuLookupCache();
  return response.data;
}

export async function createStockAdjustmentInvoiceDraft(
  payload: CreateStockAdjustmentInvoiceRequestDto,
): Promise<StockAdjustmentInvoiceResponseDto> {
  const response = await apiClient.post<StockAdjustmentInvoiceResponseDto>(
    "/invoices/stock-adjustment",
    payload,
  );

  clearProductSkuLookupCache();
  return response.data;
}

export async function confirmStockAdjustmentInvoice(
  id: string,
): Promise<StockAdjustmentInvoiceResponseDto> {
  const response = await apiClient.post<StockAdjustmentInvoiceResponseDto>(
    `/invoices/stock-adjustment/${id}/confirm`,
  );

  clearProductSkuLookupCache();
  return response.data;
}

export async function deleteStockAdjustmentInvoices(
  ids: string[],
): Promise<void> {
  await apiClient.delete("/invoices/stock-adjustment", {
    data: { ids },
  });
  clearProductSkuLookupCache();
}

/** Backward-compatible detail-page name; the endpoint now accepts every invoice status. */
export const deleteStockAdjustmentInvoiceDrafts =
  deleteStockAdjustmentInvoices;
