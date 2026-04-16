import apiClient from "@services/api-client";

export const login = async (data: {
  username: string;
  password: string;
}) => {
  const res = await apiClient.post("/auth/login", data);
  return res.data;
};

/**
 * Logs out the current user on the API by invalidating the refresh token.
 *
 * @param refreshToken - Refresh token from browser storage.
 * @returns Resolves when the API accepts logout.
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}