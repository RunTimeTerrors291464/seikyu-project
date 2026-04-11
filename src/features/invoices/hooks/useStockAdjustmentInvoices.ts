import { useEffect, useState } from "react";

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
  actionReason: StockAdjustmentInvoiceWithoutProductsDto["actionReason"];
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

type InvoiceListState = {
  rows: StockAdjustmentInvoiceRow[];
  total: number;
  page: number;
  limit: number;
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
    actionReason: dto.actionReason,
    notes: dto.notes,
  };
}

export function useStockAdjustmentInvoices(
  query: UseStockAdjustmentInvoicesQuery,
): UseStockAdjustmentInvoicesResult {
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
        const response = await getStockAdjustmentInvoiceList(query);

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

        const caughtError =
          unknownError instanceof Error
            ? unknownError
            : new Error("Failed to load stock adjustment invoices");

        setError(caughtError);
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
  }, [
    query.page,
    query.limit,
    query.search,
    query.searchBy,
    query.sortBy,
    query.sortOrder,
    query.status,
    query.actionReason,
    query.fromDate,
    query.toDate,
    refreshKey,
  ]);

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
