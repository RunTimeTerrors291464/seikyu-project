export type ProductStockStatus = 0 | 1 | 2;
export interface Product {
  id: string;
  sku: string;

  productNames: string[];

  productUnitId: string;
  productUnitName: string;
  productDescription: string;

  importPrice: number;
  sellingPrice: number;

  inventoryStock: number;
  reorderThreshold: number;

  isActive: boolean;
  stockStatus: ProductStockStatus;

  createdAt: string;
  updatedAt: string;
}

export type ProductListResponse = {
  page: number;
  limit: number;
  total: number;
  products: Product[];
};

export type ProductOverview = {
  id: string;
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: string;
  updatedAt: string;
};

export type ProductHistoryItem = {
  id: string;
  version: number;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
  eventSummary: string[];
};

export type ProductHistoryEvent = {
  fieldName: string;
  previousValue: any;
  newValue: any;
};

export type ProductHistoryDetail = {
  id: string;
  version: number;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
  events: ProductHistoryEvent[];
  eventSummary: string[];
  isSnapshot: boolean;
  data: any;
};