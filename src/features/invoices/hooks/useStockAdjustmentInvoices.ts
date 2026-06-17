"use client";

import { usePaginatedListQuery } from "@/lib/hooks/usePaginatedListQuery";
import { useDict } from "@/lib/lang/DictProvider";

import {
  getStockAdjustmentInvoiceList,
  StockAdjustmentInvoiceListQuery,
  StockAdjustmentInvoiceWithoutProductsDto,
} from "../services/stockAdjustmentInvoice.service";

export type StockAdjustmentInvoiceRow = {
  id: string;
  invoiceId: string | null;
  status: StockAdjustmentInvoiceWithoutProductsDto["status"];
  draftAt: string | null;
  /** Mirrors `draftAt` for list sorting by API `createdAt`. */
  createdAt: string | null;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
  totalProducts: number;
  totalQuantity: number;
  notes: string | null;
};

export type UseStockAdjustmentInvoicesQuery = StockAdjustmentInvoiceListQuery;

export type UseStockAdjustmentInvoicesResult = {
  rows: StockAdjustmentInvoiceRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

function mapToRow(
  dto: StockAdjustmentInvoiceWithoutProductsDto,
): StockAdjustmentInvoiceRow {
  return {
    id: dto.id,
    invoiceId: dto.invoiceId,
    status: dto.status,
    draftAt: dto.draftAt,
    createdAt: dto.draftAt,
    confirmedByUsername: dto.confirmedByUsername,
    confirmedAt: dto.confirmedAt,
    totalProducts: dto.totalProducts,
    totalQuantity: dto.totalQuantity,
    notes: dto.notes,
  };
}

function getStockAdjustmentInvoiceQueryDeps(
  query: UseStockAdjustmentInvoicesQuery,
): readonly unknown[] {
  return [
    query.page,
    query.limit,
    query.search,
    query.searchBy,
    query.sortBy,
    query.sortOrder,
    query.status,
    query.fromDate,
    query.toDate,
  ];
}

export function useStockAdjustmentInvoices(
  query: UseStockAdjustmentInvoicesQuery,
): UseStockAdjustmentInvoicesResult {
  const dict = useDict();

  return usePaginatedListQuery({
    query,
    fetchList: getStockAdjustmentInvoiceList,
    mapToRow,
    getQueryDeps: getStockAdjustmentInvoiceQueryDeps,
    fallbackErrorMessage: dict.stockAdjustmentInvoicesLoadFailed,
  });
}
