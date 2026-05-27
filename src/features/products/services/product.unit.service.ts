"use client";

import api from "@/services/api-client";

export type ProductUnit = {
  id: string;
  unitName: string;
  unitDescription: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductUnitUpdateResponse = {
  productUnit: ProductUnit;
  history: {
    id: string;
    version: number;
    createdBy: string;
    createdByUsername: string;
    createdAt: string;
    eventSummary: string[];
  };
};

export type GetUnitsParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive: "true" | "false" | "all";
};

export const productUnitService = {
  async getAll(params: GetUnitsParams) {
    const cleaned: Partial<GetUnitsParams> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleaned[key as keyof GetUnitsParams] = value as never;
      }
    });

    const res = await api.get("/product-units", { params: cleaned });

    return res.data;
  },

  async create(data: {
    unitName: string;
    unitDescription?: string;
  }): Promise<ProductUnit> {
    const res = await api.post("/product-units", data);

    return res.data;
  },

  async update(data: {
    id: string;
    unitName: string;
    unitDescription?: string;
  }): Promise<ProductUnitUpdateResponse> {
    const res = await api.patch("/product-units", data);

    return {
      productUnit: res.data.productUnit,
      history: res.data.history,
    };
  },

  async deactivate(id: string): Promise<ProductUnitUpdateResponse> {
    const res = await api.patch(`/product-units/activation/${id}/deactivate`);

    return {
      productUnit: res.data.productUnit,
      history: res.data.history,
    };
  },

  async activate(id: string): Promise<ProductUnitUpdateResponse> {
    const res = await api.patch(`/product-units/activation/${id}/activate`);

    return {
      productUnit: res.data.productUnit,
      history: res.data.history,
    };
  },
};