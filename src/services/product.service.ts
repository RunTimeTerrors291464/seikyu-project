import { Product } from "@/types/product";
import api from "./api-client";

export async function getProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const res = await api.get("/products", { params });
  return res.data;
}

export async function getProductById(id: string) {
  const res = await api.get(`/products/${id}`);
  return res.data;
}

export async function getProductBySku(sku: string) {
  const res = await api.get(`/products/sku/${sku}`);
  return res.data;
}

export async function createProduct(data: Partial<Product>) {
  const res = await api.post("/products", data);
  return res.data;
}

export async function updateProduct(data: Partial<Product>) {
  const res = await api.patch("/products", data);
  return res.data;
}

export async function activateProduct(id: string) {
  const res = await api.patch(`/products/${id}/activate`);
  return res.data;
}

export async function deactivateProduct(id: string) {
  const res = await api.patch(`/products/${id}/deactivate`);
  return res.data;
}

export async function getStockHistory(id: string) {
  const res = await api.get(`/products/stock-history/${id}`);
  return res.data;
}