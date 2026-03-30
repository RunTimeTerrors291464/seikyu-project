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
    console.debug("[productUnitService] getAll called with params:", params);

    const cleaned: Partial<GetUnitsParams> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleaned[key as keyof GetUnitsParams] = value as never;
      }
    });

    console.debug("[productUnitService] cleaned params:", cleaned);

    const res = await api.get("/product-units", { params: cleaned });

    console.debug("[productUnitService] API response:", res.data);

    return res.data;
  },

  async create(data: {
    unitName: string;
    unitDescription?: string;
  }): Promise<ProductUnit> {
    console.debug("[productUnitService] create called with data:", data);

    const res = await api.post("/product-units", data);

    // backend already returns flat object → OK
    console.debug("[productUnitService] API response:", res.data);

    return res.data;
  },

  async update(data: {
    id: string;
    unitName: string;
    unitDescription?: string;
  }): Promise<ProductUnitUpdateResponse> {
    console.debug("[productUnitService] update called with data:", data);

    const res = await api.patch("/product-units", data);

    console.debug("[productUnitService] API response:", res.data);

    return {
      productUnit: res.data.productUnit,
      history: res.data.history,
    };
  },

  async deactivate(id: string): Promise<ProductUnitUpdateResponse> {
    console.debug("[productUnitService] deactivate called for id:", id);

    const res = await api.patch(`/product-units/${id}/deactivate`);

    console.debug("[productUnitService] API response:", res.data);

    return {
      productUnit: res.data.productUnit,
      history: res.data.history,
    };
  },

  async activate(id: string): Promise<ProductUnitUpdateResponse> {
    console.debug("[productUnitService] activate called for id:", id);

    const res = await api.patch(`/product-units/${id}/activate`);

    console.debug("[productUnitService] API response:", res.data);

    return {
      productUnit: res.data.productUnit,
      history: res.data.history,
    };
  },
};