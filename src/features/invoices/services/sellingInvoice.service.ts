import apiClient from "@/services/api-client";

export type SellingInvoiceStatus =
  | "confirmed"
  | "partiallyReturned"
  | "returned";

export type SellingInvoiceWithoutProductsDto = {
  id: string;
  invoiceId: string | null;
  totalProducts: number;
  totalQuantity: number;
  totalSellingPrice: number;
  invoiceDiscount?: number;
  notes: string | null;
  status: SellingInvoiceStatus;
  /** When present, used for expandable return rows in the list UI. */
  returnCount?: number;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type SellingInvoiceProductDto = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: number;
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
  invoiceDiscount?: number;
  totalSellingPrice: number;
  notes: string | null;
  status: SellingInvoiceStatus;
  returnCount?: number;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
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
  sortBy?: "invoiceId" | "totalSellingPrice" | "confirmedAt";
  sortOrder?: "asc" | "desc";
  status?: SellingInvoiceStatus;
  fromDate?: string;
  toDate?: string;
};

export type SellingInvoiceProductLineRequestDto = {
  productSku: string;
  quantity: number;
  productDiscount: number;
  notes?: string;
};

export type CreateSellingInvoiceRequestDto = {
  products: SellingInvoiceProductLineRequestDto[];
  invoiceDiscount?: number;
  notes?: string;
};

type SellingInvoiceListParams = SellingInvoiceListQuery;

function cleanSellingInvoiceParams(
  params: SellingInvoiceListParams,
): SellingInvoiceListParams {
  const cleaned: SellingInvoiceListParams = {};

  (Object.entries(params) as [keyof SellingInvoiceListParams, string | number | undefined][])
    .forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      cleaned[key] = value as never;
    });

  return cleaned;
}

export async function getSellingInvoiceList(
  params: SellingInvoiceListQuery,
): Promise<GetListOfSellingInvoicesResponseDto> {
  const cleanedParams = cleanSellingInvoiceParams(params);

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

  return response.data;
}
