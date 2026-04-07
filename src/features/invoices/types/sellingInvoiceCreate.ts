import type { Product } from "@/features/products/types/product";
import type { SellingInvoiceProductDto } from "../services/sellingInvoice.service";
import { toNumberOrZero } from "./importInvoiceDetail";

export type EditableSellingInvoiceCreateLine = {
  localId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  sellingPrice: string;
  quantity: string;
  productDiscount: string;
  totalSellingPrice: string;
  notes: string;
};

/**
 * Maps a catalog product to an editable selling invoice draft line (SKU-based create payload).
 *
 * @param product - Product from the catalog API.
 * @param nameFallback - Label when the product has no primary name.
 * @returns Editable row with a fresh `localId` and zero quantity/discount.
 */
export function productToEditableSellingCreateLine(
  product: Product,
  nameFallback: string,
): EditableSellingInvoiceCreateLine {
  return {
    localId: `${product.id}-${Date.now()}`,
    productId: product.id,
    productSku: product.sku,
    productName: product.productNames?.[0] ?? nameFallback,
    productUnit: product.productUnitName,
    sellingPrice: String(product.sellingPrice),
    quantity: "0",
    productDiscount: "0",
    totalSellingPrice: "0",
    notes: "",
  };
}

/**
 * Maps an API selling line DTO to read-only display row (detail view uses server totals).
 *
 * @param product - Line from `getSellingInvoiceById`.
 * @returns Editable-shaped row for display tables that do not edit prices.
 */
export function sellingLineDtoToEditableDisplay(
  product: SellingInvoiceProductDto,
): EditableSellingInvoiceCreateLine {
  return {
    localId: `${product.productId}-${product.productSku}`,
    productId: product.productId,
    productSku: product.productSku,
    productName: product.productName,
    productUnit: product.productUnit,
    sellingPrice: String(product.sellingPrice),
    quantity: String(product.quantity),
    productDiscount: String(product.productDiscount),
    totalSellingPrice: String(product.totalSellingPrice),
    notes: product.notes ?? "",
  };
}

/**
 * Builds payload lines for `createSellingInvoice` from editable draft rows.
 *
 * @param lines - Current draft rows from the create popup.
 * @returns Request body product lines (SKU, quantity, discount, notes).
 */
export function sellingCreateLinesToRequest(
  lines: EditableSellingInvoiceCreateLine[],
): {
  productSku: string;
  quantity: number;
  productDiscount: number;
  notes?: string;
}[] {
  return lines.map((line) => ({
    productSku: line.productSku.trim(),
    quantity: Math.floor(toNumberOrZero(line.quantity)),
    productDiscount: toNumberOrZero(line.productDiscount),
    notes: line.notes.trim() || undefined,
  }));
}
