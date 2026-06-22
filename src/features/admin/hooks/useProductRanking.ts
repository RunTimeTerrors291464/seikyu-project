"use client";

import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { useCallback, useEffect, useState } from "react";

import {
  getProductRanking,
  type ProductRankingQuery,
  type ProductRankingRowDto,
} from "../services/dashboard.service";

export type ProductRankingRow = ProductRankingRowDto;

export type UseProductRankingResult = {
  rows: ProductRankingRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useProductRanking(
  query: ProductRankingQuery | null,
): UseProductRankingResult {
  const dict = useDict();
  const [rows, setRows] = useState<ProductRankingRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(
    function loadProductRanking(): () => void {
      if (!query?.startDate) {
        setRows([]);
        setTotal(0);
        setError(null);
        setLoading(false);
        return function noopCleanup(): void {};
      }

      let isMounted = true;
      const requestQuery = query;

      async function load(): Promise<void> {
        setLoading(true);
        setError(null);

        try {
          const response = await getProductRanking(requestQuery);

          if (!isMounted) {
            return;
          }

          setRows(response.data);
          setTotal(response.total);
          setPage(response.page);
          setLimit(response.limit);
        } catch (unknownError) {
          if (!isMounted) {
            return;
          }

          setRows([]);
          setTotal(0);
          setError(
            new Error(resolveApiErrorMessage(unknownError, dict)),
          );
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }

      void load();

      return function cleanup(): void {
        isMounted = false;
      };
    },
    [
      dict,
      query?.dateType,
      query?.endDate,
      query?.invoiceType,
      query?.limit,
      query?.page,
      query?.search,
      query?.sortOrder,
      query?.startDate,
      refreshKey,
    ],
  );

  const refetch = useCallback(function refetch(): void {
    setRefreshKey(function bumpRefreshKey(current) {
      return current + 1;
    });
  }, []);

  return {
    rows,
    total,
    page,
    limit,
    loading,
    error,
    refetch,
  };
}
