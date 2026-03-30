import apiClient from "@services/api-client";

export const login = async (data: {
  username: string;
  password: string;
}) => {
  const res = await apiClient.post("/auth/login", data);
  return res.data;
};