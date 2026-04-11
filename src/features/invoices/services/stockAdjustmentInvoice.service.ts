import apiClient from "@/services/api-client";

export type StockAdjustmentInvoiceStatus = "draft" | "confirmed";

export type StockAdjustmentAction = "add" | "subtract";

export type StockAdjustmentActionReason =
  | "damagedGoods"
  | "expiredGoods"
  | "lostGoods"
  | "theft"
  | "sampleUsage"
  | "internalUse"
  | "foundGoods"
  | "supplierBonus"
  | "returnedGoods"
  | "periodicInventoryCheck"
  | "other";

export type StockAdjustmentInvoiceProductDto = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  action: StockAdjustmentAction;
  quantity: number;
  notes: string | null;
};

export type StockAdjustmentInvoiceResponseDto = {
  id: string;
  invoiceId: string | null;
  products: StockAdjustmentInvoiceProductDto[];
  totalProducts: number;
  totalQuantity: number;
  actionReason: StockAdjustmentActionReason;
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
  actionReason: StockAdjustmentActionReason;
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
  actionReason?: StockAdjustmentActionReason;
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
  notes?: string;
};

export type CreateStockAdjustmentInvoiceRequestDto = {
  products: StockAdjustmentProductRequestDto[];
  actionReason: StockAdjustmentActionReason;
  notes?: string;
};

export type EditStockAdjustmentInvoiceRequestDto = {
  id: string;
  products: StockAdjustmentProductRequestDto[];
  actionReason: StockAdjustmentActionReason;
  notes?: string;
};

type StockAdjustmentListParams = StockAdjustmentInvoiceListQuery;

function cleanStockAdjustmentParams(
  params: StockAdjustmentListParams,
): StockAdjustmentListParams {
  const cleaned: StockAdjustmentListParams = {};

  (Object.entries(params) as [keyof StockAdjustmentListParams, string | number | undefined][])
    .forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      cleaned[key] = value as never;
    });

  return cleaned;
}

export async function getStockAdjustmentInvoiceList(
  params: StockAdjustmentInvoiceListQuery,
): Promise<GetListOfStockAdjustmentInvoicesResponseDto> {
  const cleanedParams = cleanStockAdjustmentParams(params);

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
    "/invoices/stock-adjustment/draft",
    payload,
  );

  return response.data;
}

export async function createStockAdjustmentInvoiceDraft(
  payload: CreateStockAdjustmentInvoiceRequestDto,
): Promise<StockAdjustmentInvoiceResponseDto> {
  const response = await apiClient.post<StockAdjustmentInvoiceResponseDto>(
    "/invoices/stock-adjustment/draft",
    payload,
  );

  return response.data;
}

export async function confirmStockAdjustmentInvoice(
  id: string,
): Promise<StockAdjustmentInvoiceResponseDto> {
  const response = await apiClient.patch<StockAdjustmentInvoiceResponseDto>(
    `/invoices/stock-adjustment/${id}/confirm`,
  );

  return response.data;
}

export async function deleteStockAdjustmentInvoiceDrafts(
  ids: string[],
): Promise<void> {
  await apiClient.delete("/invoices/stock-adjustment/draft", {
    data: { ids },
  });
}
