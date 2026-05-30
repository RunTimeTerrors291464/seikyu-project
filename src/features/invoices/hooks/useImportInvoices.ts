"use client";

import { parseApiError, resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { useEffect, useState } from "react";

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

type InvoiceListState = {
  rows: ImportInvoiceRow[];
  total: number;
  page: number;
  limit: number;
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

export function useImportInvoices(
  query: UseImportInvoicesQuery,
): UseImportInvoicesResult {
  const dict = useDict();
  const [state, setState] = useState<InvoiceListState>({
    rows: [],
    total: 0,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const response = await getImportInvoiceList(query);

        if (!isMounted) {
          return;
        }

        const rows = response.invoices.map(mapToRow);

        setState({
          rows,
          total: response.total,
          page: response.page,
          limit: response.limit,
        });
      } catch (unknownError) {
        if (!isMounted) {
          return;
        }

        const message = parseApiError(unknownError)
          ? resolveApiErrorMessage(unknownError, dict)
          : dict.somethingWentWrong;

        setError(new Error(message));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [dict, query.page, query.limit, query.search, query.searchBy, query.sortBy, query.sortOrder, query.status, query.fromDate, query.toDate, refreshKey]);

  function refetch(): void {
    setRefreshKey((current) => current + 1);
  }

  return {
    rows: state.rows,
    total: state.total,
    page: state.page,
    limit: state.limit,
    loading,
    error,
    refetch,
  };
}
