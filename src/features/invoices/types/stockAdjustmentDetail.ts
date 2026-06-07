import type { Product } from "@/features/products/types/product";
import { parseMoneyLikeString } from "@/lib/numeric/integerAndMoneyInputs";
import { createInvoiceLineLocalId } from "../lib/createInvoiceLineLocalId";
import type {
  StockAdjustmentAction,
  StockAdjustmentInvoiceProductDto,
  StockAdjustmentReasonCategory,
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
    localId: createInvoiceLineLocalId(product.id),
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
 * Maps editable lines to API product payloads with a shared reason category.
 *
 * @param products - Editable stock adjustment lines.
 * @param reasonCategory - Reason applied to every line on create/edit.
 * @returns Request DTO lines for stock adjustment draft endpoints.
 */
export function buildStockAdjustmentProductRequests(
  products: EditableStockAdjustmentLine[],
  reasonCategory: StockAdjustmentReasonCategory,
) {
  return products.map((product) => ({
    productId: product.productId,
    productSku: product.productSku,
    productName: product.productName,
    productUnit: product.productUnit,
    action: product.action,
    quantity: toNumberOrZero(product.quantity),
    reasonCategory,
    notes: product.notes.trim() ? product.notes.trim() : undefined,
  }));
}

/**
 * Resolves the invoice-level reason category from loaded product lines.
 *
 * @param products - Lines from a stock adjustment invoice response.
 * @returns The first line's category, or `damage` when no lines exist.
 */
export function resolveStockAdjustmentReasonCategory(
  products: StockAdjustmentInvoiceProductDto[],
): StockAdjustmentReasonCategory {
  return products[0]?.reasonCategory ?? "damage";
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
