import type { Product } from "@/features/products/types/product";
import { parseMoneyLikeString } from "@/lib/numeric/integerAndMoneyInputs";
import type { ImportInvoiceProductDto } from "../services/importInvoice.service";

export type EditableImportInvoiceProduct = {
  localId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: string;
  importPrice: string;
  notes: string;
};

/**
 * Maps a catalog product to an editable import invoice line (new row from picker or create-product flow).
 *
 * @param product - Product from the catalog API.
 * @param nameFallback - Label when the product has no primary name.
 * @returns Editable row with a fresh `localId` and zero quantity.
 */
export function productToEditableImportLine(
  product: Product,
  nameFallback: string,
): EditableImportInvoiceProduct {
  return {
    localId: `${product.id}-${Date.now()}`,
    productId: product.id,
    productSku: product.sku,
    productName: product.productNames?.[0] ?? nameFallback,
    productUnit: product.productUnitName,
    quantity: "0",
    importPrice: String(product.importPrice),
    notes: "",
  };
}

/**
 * Maps an API import line DTO to editable form state.
 *
 * @param product - Line from `getImportInvoiceById` / edit response.
 * @returns Editable row keyed by product id and SKU.
 */
export function importLineDtoToEditable(
  product: ImportInvoiceProductDto,
): EditableImportInvoiceProduct {
  return {
    localId: `${product.productId}-${product.productSku}`,
    productId: product.productId,
    productSku: product.productSku,
    productName: product.productName,
    productUnit: product.productUnit,
    quantity: String(product.quantity),
    importPrice: String(product.importPrice),
    notes: product.notes ?? "",
  };
}

/**
 * Parses quantity and money-like strings for totals and validation (comma-safe for prices).
 *
 * @param value - Raw string from a draft field.
 * @returns A finite number, or 0 when empty or unparsable.
 */
export function toNumberOrZero(value: string): number {
  return parseMoneyLikeString(value);
}
