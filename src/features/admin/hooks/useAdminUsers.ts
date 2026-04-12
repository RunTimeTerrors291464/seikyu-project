import { useCallback, useEffect, useState } from "react";

import {
  getUserList,
  type UserListQuery,
  type UserResponseDto,
} from "../services/adminUsers.service";

export type AdminUserRow = UserResponseDto;

export type UseAdminUsersResult = {
  rows: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Loads admin users list from the API when `query` changes.
 *
 * @param query - List filters (page, limit, search, etc.).
 * @returns Rows, pagination metadata, loading state, and refetch.
 */
export function useAdminUsers(query: UserListQuery): UseAdminUsersResult {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(query.page ?? 1);
  const [limit, setLimit] = useState<number>(query.limit ?? 10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState<number>(0);

  const refetch = useCallback(function refetchList(): void {
    setTick((value) => value + 1);
  }, []);

  useEffect(
    function fetchUsers() {
      let cancelled = false;

      async function run(): Promise<void> {
        setLoading(true);
        setError(null);

        try {
          const data = await getUserList(query);
          if (cancelled) {
            return;
          }
          setRows(data.users);
          setTotal(data.total);
          setPage(data.page);
          setLimit(data.limit);
        } catch (unknownError) {
          if (cancelled) {
            return;
          }
          const nextError =
            unknownError instanceof Error
              ? unknownError
              : new Error("Failed to load users");
          setError(nextError);
          setRows([]);
          setTotal(0);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void run();

      return function cleanup(): void {
        cancelled = true;
      };
    },
    [tick, query],
  );

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
