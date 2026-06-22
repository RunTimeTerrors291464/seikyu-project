import { cleanInvoiceListParams } from "@/lib/datetime/cleanInvoiceListParams";
import apiClient from "@/services/api-client";

export type DashboardInvoiceType =
  | "import"
  | "returnImport"
  | "selling"
  | "returnSelling"
  | "stockAdjustment";

export type ProductRankingDateType =
  | "daily"
  | "monthly"
  | "yearly"
  | "custom";

export type ProductRankingProductDto = {
  id: string;
  sku: string;
  name: string;
};

export type ProductRankingRowDto = {
  id: string;
  product: ProductRankingProductDto;
  quantity: number;
  totalPrice: number;
  invoiceType: DashboardInvoiceType;
  day: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductRankingResponseDto = {
  total: number;
  page: number;
  limit: number;
  data: ProductRankingRowDto[];
};

export type ProductRankingQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
  invoiceType: DashboardInvoiceType;
  dateType: ProductRankingDateType;
  startDate: string;
  endDate?: string;
};

export type PriceTrendColumnDto = {
  labelStartDate: string;
  labelEndDate: string;
  import: number;
  returnImport: number;
  selling: number;
  returnSelling: number;
  stockAdjustment: number;
};

export type PriceTrendResponseDto = {
  startDate: string;
  endDate: string;
  columns: PriceTrendColumnDto[];
};

export type PriceTrendQuery = {
  startDate: string;
  endDate?: string;
};

export async function getProductRanking(
  params: ProductRankingQuery,
): Promise<ProductRankingResponseDto> {
  const cleanedParams = cleanInvoiceListParams(params);

  const response = await apiClient.get<ProductRankingResponseDto>(
    "/dashboard/product-ranking",
    {
      params: cleanedParams,
    },
  );

  return response.data;
}

export async function getPriceTrend(
  params: PriceTrendQuery,
): Promise<PriceTrendResponseDto> {
  const cleanedParams = cleanInvoiceListParams(params);

  const response = await apiClient.get<PriceTrendResponseDto>(
    "/dashboard/price-trend",
    {
      params: cleanedParams,
    },
  );

  return response.data;
}
