import type { SellingInvoiceProductDto } from "../services/sellingInvoice.service";

export type EditableReturnSellingLine = {
  localId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  sellingPrice: string;
  returnQuantity: string;
  notes: string;
};

/**
 * Maps selling invoice product lines to editable return-draft rows (selling price read-only).
 *
 * @param product - Line from the source selling invoice.
 * @returns Row with zero return quantity until the user enters a return.
 */
export function toEditableReturnSellingLine(
  product: SellingInvoiceProductDto,
): EditableReturnSellingLine {
  return {
    localId: `${product.productId}-${product.productSku}`,
    productId: product.productId,
    productSku: product.productSku,
    productName: product.productName,
    productUnit: product.productUnit,
    sellingPrice: String(product.sellingPrice),
    returnQuantity: "0",
    notes: "",
  };
}
