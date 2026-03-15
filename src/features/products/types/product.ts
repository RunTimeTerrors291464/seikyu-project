export type ProductStatus =
  | "inStock"
  | "lowStock"
  | "outOfStock";

export interface Product {
  id: string;
  sku: string;

  names: {
    language: string;
    name: string;
  }[];

  unit_id: string;

  import_price: number;
  selling_price: number;

  current_stock: number;
  min_stock: number;

  status: ProductStatus;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}