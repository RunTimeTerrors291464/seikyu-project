import { useEffect, useState } from "react";

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
  totalSellingPrice: number;
  invoiceDiscount: number | undefined;
  totalProducts: number;
  totalQuantity: number;
  returnCount: number;
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

type InvoiceListState = {
  rows: SellingInvoiceRow[];
  total: number;
  page: number;
  limit: number;
};

function mapToRow(dto: SellingInvoiceWithoutProductsDto): SellingInvoiceRow {
  const returnCount =
    typeof dto.returnCount === "number"
      ? dto.returnCount
      : dto.status !== "confirmed"
        ? 1
        : 0;

  return {
    id: dto.id,
    invoiceId: dto.invoiceId,
    status: dto.status,
    confirmedByUsername: dto.confirmedByUsername,
    confirmedAt: dto.confirmedAt,
    totalSellingPrice: dto.totalSellingPrice,
    invoiceDiscount: dto.invoiceDiscount,
    totalProducts: dto.totalProducts,
    totalQuantity: dto.totalQuantity,
    returnCount,
    notes: dto.notes,
  };
}

export function useSellingInvoices(
  query: UseSellingInvoicesQuery,
): UseSellingInvoicesResult {
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
        const response = await getSellingInvoiceList(query);

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

        const error =
          unknownError instanceof Error
            ? unknownError
            : new Error("Failed to load selling invoices");

        setError(error);
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
