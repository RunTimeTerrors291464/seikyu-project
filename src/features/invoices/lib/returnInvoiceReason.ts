import type { ReturnImportReasonCategory } from "../services/returnImportInvoice.service";
import type { ReturnSellingReasonCategory } from "../services/returnSellingInvoice.service";

/** Default return reason when the UI only collects free-text notes per line. */
export const DEFAULT_RETURN_REASON_CATEGORY: ReturnImportReasonCategory = "other";

/** Default return reason for return-selling lines. */
export const DEFAULT_RETURN_SELLING_REASON_CATEGORY: ReturnSellingReasonCategory =
  "other";

/**
 * Builds a return-import product payload from editable line notes.
 *
 * @param productId - Product UUID.
 * @param returnQuantity - Positive return quantity.
 * @param reasonNotes - User-entered note mapped to API `reasonNotes`.
 * @returns Request line accepted by the v2 return-import API.
 */
export function buildReturnImportProductRequest(
  productId: string,
  returnQuantity: number,
  reasonNotes: string,
) {
  return {
    productId,
    returnQuantity,
    reasonCategory: DEFAULT_RETURN_REASON_CATEGORY,
    reasonNotes: reasonNotes.trim() ? reasonNotes.trim() : undefined,
  };
}

/**
 * Builds a return-selling product payload from editable line notes.
 *
 * @param productId - Product UUID.
 * @param returnQuantity - Positive return quantity.
 * @param reasonNotes - User-entered note mapped to API `reasonNotes`.
 * @returns Request line accepted by the v2 return-selling API.
 */
export function buildReturnSellingProductRequest(
  productId: string,
  returnQuantity: number,
  reasonNotes: string,
) {
  return {
    productId,
    returnQuantity,
    reasonCategory: DEFAULT_RETURN_SELLING_REASON_CATEGORY,
    reasonNotes: reasonNotes.trim() ? reasonNotes.trim() : undefined,
  };
}
