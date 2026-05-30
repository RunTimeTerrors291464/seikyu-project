export type ProductStockStatus = 0 | 1 | 2;
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ProductHistoryNameItem = {
  id?: string;
  name?: string;
  isDefault?: boolean;
};
export interface Product {
  id: string;
  sku: string;

  productNames: string[];

  productUnitId: string;
  productUnitName: string;
  /** Present on list/by-unit responses when the API includes unit activation state. */
  isUnitActive?: boolean;
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

export type GetProductHistoryListResponse = {
  page: number;
  limit: number;
  total: number;
  history: ProductHistoryItem[];
};

export type ProductStockHistoryQuantityType = "add" | "subtract";

export type ProductStockHistoryInvoiceType =
  | "import"
  | "selling"
  | "returnImport"
  | "returnSelling"
  | "stockAdjustment";

export type ProductStockHistoryItem = {
  id: string;
  productId: string;
  quantityType: ProductStockHistoryQuantityType;
  quantity: number;
  invoiceType: ProductStockHistoryInvoiceType;
  invoiceId: string;
  beforeInventoryStock: number;
  afterInventoryStock: number;
  createdAt: string;
};

export type GetProductStockHistoryResponse = {
  page: number;
  limit: number;
  total: number;
  stockHistory: ProductStockHistoryItem[];
};

export type ProductHistoryEvent = {
  fieldName: string;
  previousValue: JsonValue | ProductHistoryNameItem[] | undefined;
  newValue: JsonValue | ProductHistoryNameItem[] | undefined;
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
  data: Record<string, JsonValue> | null;
};

export type CreateProductPayload = {
  sku: string;
  productNames: string[];
  productUnitId: string;
  productDescription?: string;
  importPrice: number;
  sellingPrice: number;
  reorderThreshold?: number;
};