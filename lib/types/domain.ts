export type ID = string;

export type CurrencyCode = "USD" | "VND" | "EUR";

export type InvoiceStatus =
  | "CREATED"
  | "PARTIAL_RETURN"
  | "RETURN"
  | "CANCELLED";

export interface UserRef {
  id: ID;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface Customer {
  id: ID;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Product {
  id: ID;
  sku: string;
  name: string;
  unit: string; // e.g., 'pcs', 'cs/100db'
  price: number; // unit price
  stock: number;
  category?: string;
}

export interface LineItem {
  id: ID;
  productId: ID;
  sku: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  discountPct?: number; // 0..100
  total: number; // computed
}

export type DiscountType = "PERCENT" | "AMOUNT";

export interface Invoice {
  id: ID;
  number: string;
  status: InvoiceStatus;
  customerId: ID;
  customer?: Customer;
  createdBy: UserRef;
  createdAt: string; // ISO
  postingAt: string; // ISO
  subtotal: number;
  discountType?: DiscountType;
  discountValue?: number; // percent or amount based on discountType
  taxIncluded?: boolean; // AT
  total: number;
  note?: string;
  attachmentUrl?: string;
  returnAgainstId?: ID;
  currency?: CurrencyCode;
}
