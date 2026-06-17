"use client";

import { usePaginatedListQuery } from "@/lib/hooks/usePaginatedListQuery";
import { useDict } from "@/lib/lang/DictProvider";

import {
  getSellingInvoiceList,
  SellingInvoiceListQuery,
  SellingInvoiceStatus,
  SellingInvoiceWithoutProductsDto,
} from "../services/sellingInvoice.service";

export type SellingInvoiceRow = {
  id: string;
  invoiceId: string | null;
  status: SellingInvoiceStatus;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
  createdAt: string;
  totalSellingPrice: number;
  invoiceDiscount: number;
  totalProducts: number;
  totalQuantity: number;
  returnCount: number;
  taxFocus: boolean;
  notes: string | null;
};

export type UseSellingInvoicesQuery = SellingInvoiceListQuery;

export type UseSellingInvoicesResult = {
  rows: SellingInvoiceRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

function mapToRow(dto: SellingInvoiceWithoutProductsDto): SellingInvoiceRow {
  return {
    id: dto.id,
    invoiceId: dto.invoiceId,
    status: dto.status,
    confirmedByUsername: dto.confirmedByUsername,
    confirmedAt: dto.confirmedAt,
    createdAt: dto.createdAt,
    totalSellingPrice: dto.totalSellingPrice,
    invoiceDiscount: dto.invoiceDiscount,
    totalProducts: dto.totalProducts,
    totalQuantity: dto.totalQuantity,
    returnCount: dto.returnCount,
    taxFocus: dto.taxFocus,
    notes: dto.notes,
  };
}

function getSellingInvoiceQueryDeps(
  query: UseSellingInvoicesQuery,
): readonly unknown[] {
  return [
    query.page,
    query.limit,
    query.search,
    query.searchBy,
    query.sortBy,
    query.sortOrder,
    query.status,
    query.taxFocus,
    query.fromDate,
    query.toDate,
  ];
}

export function useSellingInvoices(
  query: UseSellingInvoicesQuery,
): UseSellingInvoicesResult {
  const dict = useDict();

  return usePaginatedListQuery({
    query,
    fetchList: getSellingInvoiceList,
    mapToRow,
    getQueryDeps: getSellingInvoiceQueryDeps,
    fallbackErrorMessage: dict.sellingInvoicesLoadFailed,
  });
}
