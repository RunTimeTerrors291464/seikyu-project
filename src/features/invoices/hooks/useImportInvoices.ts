"use client";

import { parseApiError, resolveApiErrorMessage } from "@/lib/api/errors";
import { usePaginatedListQuery } from "@/lib/hooks/usePaginatedListQuery";
import { useDict } from "@/lib/lang/DictProvider";
import type { Dictionary } from "@/lib/lang/i18n";

import {
  getImportInvoiceList,
  ImportInvoiceListQuery,
  ImportInvoiceStatus,
  ImportInvoiceWithoutProductsDto,
  parseImportInvoiceMoney,
} from "../services/importInvoice.service";

export type ImportInvoiceRow = {
  id: string;
  invoiceId: string | null;
  status: ImportInvoiceStatus;
  draftAt: string | null;
  createdAt: string;
  confirmedByUsername: string | null;
  confirmedAt: string | null;
  totalImportPrice: number;
  totalProducts: number;
  totalQuantity: number;
  returnCount: number;
  notes: string | null;
};

export type UseImportInvoicesQuery = ImportInvoiceListQuery;

export type UseImportInvoicesResult = {
  rows: ImportInvoiceRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

function mapToRow(dto: ImportInvoiceWithoutProductsDto): ImportInvoiceRow {
  return {
    id: dto.id,
    invoiceId: dto.invoiceId,
    status: dto.status,
    draftAt: dto.draftAt,
    createdAt: dto.createdAt,
    confirmedByUsername: dto.confirmedByUsername,
    confirmedAt: dto.confirmedAt,
    totalImportPrice: parseImportInvoiceMoney(dto.totalImportPrice),
    totalProducts: dto.totalProducts,
    totalQuantity: dto.totalQuantity,
    returnCount: dto.returnCount,
    notes: dto.notes,
  };
}

function getImportInvoiceQueryDeps(
  query: UseImportInvoicesQuery,
  dict: Dictionary,
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
    dict,
  ];
}

export function useImportInvoices(
  query: UseImportInvoicesQuery,
): UseImportInvoicesResult {
  const dict = useDict();

  return usePaginatedListQuery({
    query,
    fetchList: getImportInvoiceList,
    mapToRow,
    getQueryDeps: function getImportInvoiceQueryDepsWithDict(
      currentQuery,
    ): readonly unknown[] {
      return getImportInvoiceQueryDeps(currentQuery, dict);
    },
    resolveErrorMessage: function resolveImportListError(error: unknown): string {
      return parseApiError(error)
        ? resolveApiErrorMessage(error, dict)
        : dict.somethingWentWrong;
    },
    fallbackErrorMessage: dict.somethingWentWrong,
  });
}
