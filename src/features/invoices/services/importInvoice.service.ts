import apiClient from "@/services/api-client";

export type ImportInvoiceStatus =
  | "draft"
  | "confirmed"
  | "partiallyReturned"
  | "returned";

export type ImportInvoiceWithoutProductsDto = {
  id: string;
  invoiceId: string | null;
  totalProducts: number;
  totalQuantity: number;
  totalImportPrice: number;
  notes: string | null;
  status: ImportInvoiceStatus;
  returnCount: number;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
};

export type ImportInvoiceProductDto = {
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: number;
  importPrice: number;
  notes: string | null;
};

export type ImportInvoiceResponseDto = {
  id: string;
  invoiceId: string | null;
  products: ImportInvoiceProductDto[];
  totalProducts: number;
  totalQuantity: number;
  totalImportPrice: number;
  notes: string | null;
  status: ImportInvoiceStatus;
  returnCount: number;
  draftBy: string | null;
  draftByUsername: string | null;
  draftAt: string | null;
  confirmedBy: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
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
  sortBy?: "invoiceId" | "userId" | "totalImportPrice" | "createdAt";
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

type ImportInvoiceListParams = ImportInvoiceListQuery;

function cleanImportInvoiceParams(
  params: ImportInvoiceListParams,
): ImportInvoiceListParams {
  const cleaned: ImportInvoiceListParams = {};

  (Object.entries(params) as [keyof ImportInvoiceListParams, string | number | undefined][])
    .forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      cleaned[key] = value as never;
    });

  return cleaned;
}

export async function getImportInvoiceList(
  params: ImportInvoiceListQuery,
): Promise<GetListOfImportInvoicesResponseDto> {
  const cleanedParams = cleanImportInvoiceParams(params);

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
    "/invoices/import/draft",
    payload,
  );

  return response.data;
}

export async function createImportInvoiceDraft(
  payload: CreateImportInvoiceRequestDto,
): Promise<ImportInvoiceResponseDto> {
  const response = await apiClient.post<ImportInvoiceResponseDto>(
    "/invoices/import/draft",
    payload,
  );

  return response.data;
}

export async function confirmImportInvoice(
  id: string,
): Promise<ImportInvoiceResponseDto> {
  const response = await apiClient.patch<ImportInvoiceResponseDto>(
    `/invoices/import/${id}/confirm`,
  );

  return response.data;
}

export async function deleteImportInvoiceDrafts(
  ids: string[],
): Promise<void> {
  await apiClient.delete("/invoices/import/draft", {
    data: { ids },
  });
}
