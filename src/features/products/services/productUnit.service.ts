import api from "@/services/api-client";

export type ProductUnit = {
  id: string;
  unitName: string;
  unitDescription: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ============================= */
/* Product Unit Service */
/* ============================= */

export const productUnitService = {

  // 🔹 Get product unit by ID
  async getById(id: string): Promise<ProductUnit> {

    console.log("PRODUCT UNIT → getById called", id);

    try {
      const res = await api.get<ProductUnit>(
        `/api/v1/product-units/${id}`
      );

      console.log("PRODUCT UNIT → getById success", res.data);

      return res.data;

    } catch (error: any) {

      console.error(
        "PRODUCT UNIT → getById failed",
        error.response?.data
      );

      throw error;
    }
  }

};