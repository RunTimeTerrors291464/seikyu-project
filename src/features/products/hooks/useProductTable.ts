"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SortDirection = "asc" | "desc";

type BaseQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortDirection;
};

type UseProductTableProps<T, Q extends BaseQuery> = {
  fetcher: (query: Q) => Promise<{
    products: T[];
    total: number;
  }>;

  initialQuery: Q;
  enabled?: boolean;
};

export function useProductTable<T, Q extends BaseQuery>({
  fetcher,
  initialQuery,
  enabled = true,
}: UseProductTableProps<T, Q>) {

  const [query, setQuery] = useState<Q>(initialQuery);

  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // prevent duplicate fetch
  // function isSameQuery(a: unknown, b: unknown) {
  //   return JSON.stringify(a) === JSON.stringify(b);
  // }

  /* ============================= */
  /* FETCH */
  /* ============================= */

  useEffect(() => {
    if (!enabled) {
      return;
    }

    async function load() {
      setLoading(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetcher(query);
        setData(res.products);
        setTotal(res.total);
      } catch (err) {
        console.error("[useProductTable] fetch error", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [enabled, query, fetcher, refreshKey]);

  /* ============================= */
  /* ACTIONS */
  /* ============================= */

  const setPage = (page: number) => {
    setQuery((q) => ({ ...q, page }));
  };

  const setLimit = (limit: number) => {
    setQuery((q) => ({ ...q, page: 1, limit }));
  };

  const setSort = (field: Q["sortBy"]) => {
    setQuery((q) => {
      const isSame = q.sortBy === field;

      return {
        ...q,
        page: 1,
        sortBy: field,
        sortOrder: isSame
          ? q.sortOrder === "asc"
            ? "desc"
            : "asc"
          : "asc",
      };
    });
  };

  const setFilters = (filters: Partial<Q>) => {
    setQuery((prev) => {
      const next: Partial<Q> = { ...prev };
      let changed = false;

      for (const key in filters) {
        const typedKey = key as keyof Q;
        const value = filters[typedKey];

        if (prev[typedKey] !== value) {
          next[typedKey] = value;
          changed = true;
        }
      }

      if (!changed) return prev;

      next.page = 1;
      return next as Q;
    });
  };

  const resetQuery = () => {
    setQuery(initialQuery);
  };

  const refetch = () => {
    setRefreshKey((k) => k + 1);
  };

  /* ============================= */
  /* PAGINATION */
  /* ============================= */

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((total || 0) / (query.limit || 10)));
  }, [total, query.limit]);

  /* ============================= */
  /* RETURN */
  /* ============================= */

  return {
    data,
    total,
    loading,

    query,

    setPage,
    setLimit,
    setSort,
    setFilters,
    resetQuery,
    refetch,

    totalPages,
  };
}
