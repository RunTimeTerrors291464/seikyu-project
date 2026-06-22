"use client";

import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { useCallback, useEffect, useState } from "react";

import type { DailySellingIncomeHighestInvoice } from "../lib/aggregateDailySellingIncome";
import {
  getDailySellingIncome,
  type DailySellingIncomeQuery,
  type DailySellingIncomeRow,
} from "../services/dailySellingIncome.service";

export type DailyIncomeRow = DailySellingIncomeRow;

export type UseDailySellingIncomeResult = {
  rows: DailyIncomeRow[];
  grandTotalHuf: number;
  invoiceCount: number;
  highestValueInvoice: DailySellingIncomeHighestInvoice | null;
  averageInvoicesPerDay: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

const EMPTY_STATS = {
  rows: [] as DailyIncomeRow[],
  grandTotalHuf: 0,
  invoiceCount: 0,
  highestValueInvoice: null as DailySellingIncomeHighestInvoice | null,
  averageInvoicesPerDay: 0,
};

export function useDailySellingIncome(
  query: DailySellingIncomeQuery,
): UseDailySellingIncomeResult {
  const dict = useDict();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const fromDate = query.fromDate;
  const toDate = query.toDate;

  useEffect(
    function loadDailyIncome(): () => void {
      if (!fromDate || !toDate) {
        setStats(EMPTY_STATS);
        setError(null);
        setLoading(false);
        return function noopCleanup(): void {};
      }

      let isMounted = true;

      async function load(): Promise<void> {
        setLoading(true);
        setError(null);

        try {
          const response = await getDailySellingIncome({
            fromDate,
            toDate,
          });

          if (!isMounted) {
            return;
          }

          setStats({
            rows: response.rows,
            grandTotalHuf: response.grandTotalHuf,
            invoiceCount: response.invoiceCount,
            highestValueInvoice: response.highestValueInvoice,
            averageInvoicesPerDay: response.averageInvoicesPerDay,
          });
        } catch (unknownError) {
          if (!isMounted) {
            return;
          }

          setStats(EMPTY_STATS);
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
    [dict, fromDate, toDate, refreshKey],
  );

  const refetch = useCallback(function refetch(): void {
    setRefreshKey(function bumpRefreshKey(current) {
      return current + 1;
    });
  }, []);

  return {
    rows: stats.rows,
    grandTotalHuf: stats.grandTotalHuf,
    invoiceCount: stats.invoiceCount,
    highestValueInvoice: stats.highestValueInvoice,
    averageInvoicesPerDay: stats.averageInvoicesPerDay,
    loading,
    error,
    refetch,
  };
}
