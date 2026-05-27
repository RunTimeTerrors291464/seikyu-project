import apiClient from "@/services/api-client";

/** Platform role codes: 1 ADMIN, 2 MANAGER, 3 CASHIER. */
export const USER_ROLE_ADMIN = 1;
export const USER_ROLE_MANAGER = 2;
export const USER_ROLE_CASHIER = 3;

export type UserRoleCode =
  | typeof USER_ROLE_ADMIN
  | typeof USER_ROLE_MANAGER
  | typeof USER_ROLE_CASHIER;

export type UserResponseDto = {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  username: string;
  roles: UserRoleCode[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GetListOfUsersResponseDto = {
  page: number;
  limit: number;
  total: number;
  users: UserResponseDto[];
};

export type UserListSearchBy = "fullName" | "username";

export type UserListIsActiveFilter = "true" | "false" | "all";

export type UserListSortBy =
  | "fullName"
  | "username"
  | "createdAt"
  | "updatedAt"
  | "isActive";

export type UserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  searchBy?: UserListSearchBy;
  /**
   * When omitted, the list is not filtered by role. When set (one or more codes),
   * the API should return only users who **include at least one** of these roles.
   * Each returned user should still include their **full** `roles` array on the DTO
   * so the table can show every role they have (not only the filter subset).
   */
  roles?: UserRoleCode[];
  isActive?: UserListIsActiveFilter;
  sortBy?: UserListSortBy;
  sortOrder?: "asc" | "desc";
};

export type CreateNewUserRequestDto = {
  firstName: string;
  middleName?: string;
  lastName?: string;
  username: string;
  password: string;
  roles: UserRoleCode[];
};

/**
 * Partial update payload for `PATCH /admin/users`.
 * Backend may accept a subset of fields; `id` identifies the user.
 */
export type EditUserRequestDto = {
  id: string;
  firstName?: string;
  middleName?: string | null;
  lastName?: string | null;
  username?: string;
  roles?: UserRoleCode[];
};

export type AdminResetPasswordRequestDto = {
  id: string;
  password: string;
};

/**
 * Serializes user list query params, including repeated `roles` keys.
 *
 * @param query - Filter and pagination options.
 * @returns Query string without leading `?`, or empty string.
 */
function buildUserListQueryString(query: UserListQuery): string {
  const params = new URLSearchParams();

  if (query.page != null) {
    params.set("page", String(query.page));
  }
  if (query.limit != null) {
    params.set("limit", String(query.limit));
  }
  if (query.search) {
    params.set("search", query.search);
  }
  if (query.searchBy) {
    params.set("searchBy", query.searchBy);
  }
  if (query.roles?.length) {
    for (const role of query.roles) {
      params.append("roles", String(role));
    }
  }
  if (query.isActive) {
    params.set("isActive", query.isActive);
  }
  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }
  if (query.sortOrder) {
    params.set("sortOrder", query.sortOrder);
  }

  return params.toString();
}

/**
 * Fetches a paginated list of users (admin API).
 *
 * @param query - Optional filters and sorting.
 * @returns Paginated user list DTO.
 */
export async function getUserList(
  query: UserListQuery,
): Promise<GetListOfUsersResponseDto> {
  const qs = buildUserListQueryString(query);
  const url = qs.length > 0 ? `/admin/users?${qs}` : "/admin/users";
  const { data } = await apiClient.get<GetListOfUsersResponseDto>(url);
  return data;
}

/**
 * Loads a single user by id.
 *
 * @param userId - User UUID.
 * @returns User DTO.
 */
export async function getUserById(userId: string): Promise<UserResponseDto> {
  const { data } = await apiClient.get<UserResponseDto>(
    `/admin/users/${encodeURIComponent(userId)}`,
  );
  return data;
}

/**
 * Creates a new user account.
 *
 * @param body - Create user payload.
 * @returns Created user DTO.
 */
export async function createUser(
  body: CreateNewUserRequestDto,
): Promise<UserResponseDto> {
  const { data } = await apiClient.post<UserResponseDto>(
    "/admin/users",
    body,
  );
  return data;
}

/**
 * Updates an existing user (non-password fields).
 *
 * @param body - Edit payload including user `id`.
 * @returns Updated user DTO.
 */
export async function editUser(
  body: EditUserRequestDto,
): Promise<UserResponseDto> {
  const { data } = await apiClient.patch<UserResponseDto>(
    "/admin/users",
    body,
  );
  return data;
}

/**
 * Deactivates a user account.
 *
 * @param userId - User UUID.
 * @returns Updated user DTO.
 */
export async function deactivateUser(
  userId: string,
): Promise<UserResponseDto> {
  const { data } = await apiClient.patch<UserResponseDto>(
    `/admin/users/activation/${encodeURIComponent(userId)}/deactivate`,
  );
  return data;
}

/**
 * Reactivates a user account.
 *
 * @param userId - User UUID.
 * @returns Updated user DTO.
 */
export async function activateUser(userId: string): Promise<UserResponseDto> {
  const { data } = await apiClient.patch<UserResponseDto>(
    `/admin/users/activation/${encodeURIComponent(userId)}/activate`,
  );
  return data;
}

/**
 * Sets a new password for a user (admin operation).
 *
 * @param body - Target user id and new password.
 * @returns Updated user DTO.
 */
export async function resetUserPassword(
  body: AdminResetPasswordRequestDto,
): Promise<UserResponseDto> {
  const { data } = await apiClient.post<UserResponseDto>(
    "/admin/users/reset-password",
    body,
  );
  return data;
}
