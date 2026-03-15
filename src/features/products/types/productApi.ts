export type ProductStockStatus = 0 | 1 | 2;

export type ProductApi = {
  id: string;
  sku: string;
  productNames: string[];
  productUnitId: string;
  productUnitName: string;
  productDescription: string;
  importPrice: number;
  sellingPrice: number;
  reorderThreshold: number;
  inventoryStock: number;
  active: boolean;
  stockStatus: ProductStockStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  page: number;
  limit: number;
  total: number;
  products: ProductApi[];
};