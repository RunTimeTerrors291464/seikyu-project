import type { ReturnSellingInvoiceProductResponseDto } from "../services/returnSellingInvoice.service";
import { toNumberOrZero } from "./importInvoiceDetail";

export type EditableReturnSellingDetailLine = {
  lineId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  sellingPrice: string;
  returnQuantity: string;
  notes: string;
};

/**
 * Maps an API return-selling line to editable form state for the return detail page.
 *
 * @param line - Line from `getReturnSellingInvoiceById`.
 * @returns Editable row with string fields for inputs.
 */
export function toEditableReturnSellingDetailLine(
  line: ReturnSellingInvoiceProductResponseDto,
): EditableReturnSellingDetailLine {
  return {
    lineId: line.id,
    productId: line.productId,
    productSku: line.productSku,
    productName: line.productName,
    productUnit: line.productUnit,
    sellingPrice: String(line.sellingPrice),
    returnQuantity: String(line.returnQuantity),
    notes: line.reasonNotes ?? "",
  };
}

/**
 * Builds a stable JSON signature of return lines for dirty-checking drafts.
 *
 * @param lines - Current editable return lines.
 * @returns Canonical string for comparison.
 */
export function toReturnSellingLinesSignature(
  lines: EditableReturnSellingDetailLine[],
): string {
  return JSON.stringify(
    lines.map((line) => ({
      productId: line.productId,
      returnQuantity: Math.floor(toNumberOrZero(line.returnQuantity)),
      notes: (line.notes || "").trim(),
    })),
  );
}
