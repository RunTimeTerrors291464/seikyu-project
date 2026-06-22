"use client";

import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { useCallback, useEffect, useState } from "react";

import {
  getPriceTrend,
  type PriceTrendColumnDto,
  type PriceTrendQuery,
} from "../services/dashboard.service";

export type PriceTrendRow = PriceTrendColumnDto;

export type UsePriceTrendResult = {
  columns: PriceTrendRow[];
  startDate: string | null;
  endDate: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function usePriceTrend(query: PriceTrendQuery | null): UsePriceTrendResult {
  const dict = useDict();
  const [columns, setColumns] = useState<PriceTrendRow[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const startDateParam = query?.startDate;
  const endDateParam = query?.endDate;

  useEffect(
    function loadPriceTrend(): () => void {
      if (!startDateParam) {
        setColumns([]);
        setStartDate(null);
        setEndDate(null);
        setError(null);
        setLoading(false);
        return function noopCleanup(): void {};
      }

      let isMounted = true;
      const requestStartDate = startDateParam;

      async function load(): Promise<void> {
        setLoading(true);
        setError(null);

        try {
          const response = await getPriceTrend({
            startDate: requestStartDate,
            endDate: endDateParam,
          });

          if (!isMounted) {
            return;
          }

          setColumns(response.columns);
          setStartDate(response.startDate);
          setEndDate(response.endDate);
        } catch (unknownError) {
          if (!isMounted) {
            return;
          }

          setColumns([]);
          setStartDate(null);
          setEndDate(null);
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
    [dict, endDateParam, refreshKey, startDateParam],
  );

  const refetch = useCallback(function refetch(): void {
    setRefreshKey(function bumpRefreshKey(current) {
      return current + 1;
    });
  }, []);

  return {
    columns,
    startDate,
    endDate,
    loading,
    error,
    refetch,
  };
}
