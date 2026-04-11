import type { Product } from "@/features/products/types/product";
import { parseMoneyLikeString } from "@/lib/numeric/integerAndMoneyInputs";
import type {
  StockAdjustmentAction,
  StockAdjustmentInvoiceProductDto,
} from "../services/stockAdjustmentInvoice.service";

export type EditableStockAdjustmentLine = {
  localId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  action: StockAdjustmentAction;
  quantity: string;
  notes: string;
};

/**
 * Maps a catalog product to a new stock adjustment line (default subtract, quantity 0).
 *
 * @param product - Product from the catalog API.
 * @param nameFallback - Label when the product has no primary name.
 * @returns Editable row with a fresh `localId`.
 */
export function productToEditableStockAdjustmentLine(
  product: Product,
  nameFallback: string,
): EditableStockAdjustmentLine {
  return {
    localId: `${product.id}-${Date.now()}`,
    productId: product.id,
    productSku: product.sku,
    productName: product.productNames?.[0] ?? nameFallback,
    productUnit: product.productUnitName,
    action: "subtract",
    quantity: "0",
    notes: "",
  };
}

/**
 * Maps an API line DTO to editable form state.
 *
 * @param product - Line from `getStockAdjustmentInvoiceById` / edit response.
 * @returns Editable row keyed by server line id.
 */
export function stockAdjustmentLineDtoToEditable(
  product: StockAdjustmentInvoiceProductDto,
): EditableStockAdjustmentLine {
  return {
    localId: product.id,
    productId: product.productId,
    productSku: product.productSku,
    productName: product.productName,
    productUnit: product.productUnit,
    action: product.action,
    quantity: String(product.quantity),
    notes: product.notes ?? "",
  };
}

/**
 * Parses quantity strings for totals and validation.
 *
 * @param value - Raw string from a draft field.
 * @returns A finite number, or 0 when empty or unparsable.
 */
export function toNumberOrZero(value: string): number {
  return parseMoneyLikeString(value);
}
