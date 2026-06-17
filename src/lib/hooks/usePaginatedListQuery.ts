"use client";

import { useCallback, useEffect, useState } from "react";

export type PaginatedListResponse<TItem> = {
  invoices: TItem[];
  total: number;
  page: number;
  limit: number;
};

export type PaginatedListQueryResult<TRow> = {
  rows: TRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

type PaginatedListState<TRow> = {
  rows: TRow[];
  total: number;
  page: number;
  limit: number;
};

type PaginatedQuery = {
  page?: number;
  limit?: number;
};

type UsePaginatedListQueryOptions<
  TDto,
  TRow,
  TQuery extends PaginatedQuery,
> = {
  query: TQuery;
  fetchList: (query: TQuery) => Promise<PaginatedListResponse<TDto>>;
  mapToRow: (dto: TDto) => TRow;
  getQueryDeps: (query: TQuery) => readonly unknown[];
  resolveErrorMessage?: (error: unknown) => string;
  fallbackErrorMessage?: string;
};

/**
 * Shared fetch/state pattern for paginated invoice (and similar) list endpoints.
 */
export function usePaginatedListQuery<
  TDto,
  TRow,
  TQuery extends PaginatedQuery,
>(
  options: UsePaginatedListQueryOptions<TDto, TRow, TQuery>,
): PaginatedListQueryResult<TRow> {
  const {
    query,
    fetchList,
    mapToRow,
    getQueryDeps,
    resolveErrorMessage,
    fallbackErrorMessage = "Failed to load list",
  } = options;

  const [state, setState] = useState<PaginatedListState<TRow>>({
    rows: [],
    total: 0,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const queryDeps = getQueryDeps(query);

  useEffect(
    function loadPaginatedList(): () => void {
      let isMounted = true;

      async function load(): Promise<void> {
        setLoading(true);
        setError(null);

        try {
          const response = await fetchList(query);

          if (!isMounted) {
            return;
          }

          setState({
            rows: response.invoices.map(mapToRow),
            total: response.total,
            page: response.page,
            limit: response.limit,
          });
        } catch (unknownError) {
          if (!isMounted) {
            return;
          }

          const message =
            resolveErrorMessage?.(unknownError) ??
            (unknownError instanceof Error
              ? unknownError.message
              : fallbackErrorMessage);

          setError(new Error(message));
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
    [...queryDeps, refreshKey],
  );

  const refetch = useCallback(function refetch(): void {
    setRefreshKey(function bumpRefreshKey(current) {
      return current + 1;
    });
  }, []);

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
