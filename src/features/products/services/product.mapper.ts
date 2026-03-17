import { ProductDetailResponse } from "@/features/products/services/product.service";

/* ============================= */
/* UI Model */
/* ============================= */

export type ProductDetail = {
  id: string;
  sku: string;

  productName: string;
  names: { id: string; name: string }[];

  unit: string;
  description: string;

  importPrice: number;
  sellingPrice: number;

  reorderThreshold: number;
  currentStock: number;

  active: boolean;
  stockStatus: number;

  createdAt: string;
  updatedAt: string;
};

/* ============================= */
/* Mapper */
/* ============================= */

export function mapProductDetail(
  data: ProductDetailResponse
): ProductDetail {

  return {
    id: data.id,
    sku: data.sku,

    // first name = main name
    productName: data.productNames?.[0] || "",

    names: data.productNames.map((n, i) => ({
      id: `${i}`,
      name: n
    })),

    unit: data.productUnitName,
    description: data.productDescription,

    importPrice: data.importPrice,
    sellingPrice: data.sellingPrice,

    reorderThreshold: data.reorderThreshold,
    currentStock: data.inventoryStock,

    active: data.active,
    stockStatus: data.stockStatus,

    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}