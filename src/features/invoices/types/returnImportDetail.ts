import type { ReturnImportInvoiceProductResponseDto } from "../services/returnImportInvoice.service";
import { createStableSignature } from "../lib/stableSignature";
import { toNumberOrZero } from "./importInvoiceDetail";

export type EditableReturnInvoiceDetailLine = {
  lineId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  importPrice: string;
  returnQuantity: string;
  notes: string;
};

/**
 * Maps an API return line to editable form state for the return invoice detail page.
 *
 * @param line — Return line from `getReturnImportInvoiceById`.
 * @returns Editable row with string fields for inputs.
 */
export function toEditableReturnDetailLine(
  line: ReturnImportInvoiceProductResponseDto,
): EditableReturnInvoiceDetailLine {
  return {
    lineId: line.id,
    productId: line.productId,
    productSku: line.productSku,
    productName: line.productName,
    productUnit: line.productUnit,
    importPrice: String(line.importPrice),
    returnQuantity: String(line.returnQuantity),
    notes: line.reasonNotes ?? "",
  };
}

/**
 * Builds a stable JSON signature of return lines for dirty-checking drafts.
 *
 * @param lines — Current editable return lines.
 * @returns Canonical string for comparison.
 */
export function toReturnLinesSignature(
  lines: EditableReturnInvoiceDetailLine[],
): string {
  return createStableSignature(
    lines,
    function projectReturnLine(line) {
      return {
      productId: line.productId,
      returnQuantity: Math.floor(toNumberOrZero(line.returnQuantity)),
      notes: (line.notes || "").trim(),
      };
    },
  );
}
