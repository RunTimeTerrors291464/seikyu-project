"use client";

import { resolveApiErrorMessage } from "@/lib/api/errors";
import {
  usePaginatedListQuery,
  type PaginatedListResponse,
  type PaginatedListQueryResult,
} from "@/lib/hooks/usePaginatedListQuery";
import { useDict } from "@/lib/lang/DictProvider";

import {
  getUserList,
  type UserListQuery,
  type UserResponseDto,
} from "../services/adminUsers.service";

export type AdminUserRow = UserResponseDto;

export type UseAdminUsersResult = PaginatedListQueryResult<AdminUserRow>;

function mapToRow(dto: UserResponseDto): AdminUserRow {
  return dto;
}

function getItems(
  response: PaginatedListResponse<UserResponseDto>,
): UserResponseDto[] {
  const raw = response as unknown as { users?: UserResponseDto[] };
  return raw.users ?? [];
}

function getQueryDeps(query: UserListQuery): readonly unknown[] {
  return [
    query.page,
    query.limit,
    query.search,
    query.searchBy,
    query.roles,
    query.isActive,
    query.sortBy,
    query.sortOrder,
  ];
}

/**
 * Loads admin users list from the API when `query` changes.
 *
 * @param query - List filters (page, limit, search, etc.).
 * @returns Rows, pagination metadata, loading state, and refetch.
 */
export function useAdminUsers(query: UserListQuery): UseAdminUsersResult {
  const dict = useDict();

  return usePaginatedListQuery({
    query,
    fetchList: getUserList,
    getItems,
    mapToRow,
    getQueryDeps,
    resolveErrorMessage: (error) => resolveApiErrorMessage(error, dict),
    fallbackErrorMessage: dict.userListLoadError,
  });
}
