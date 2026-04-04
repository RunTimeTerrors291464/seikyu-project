import type { ImportInvoiceProductDto } from "../services/importInvoice.service";

export type EditableReturnImportLine = {
  localId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  importPrice: string;
  returnQuantity: string;
  notes: string;
};

export function toEditableReturnImportLine(
  product: ImportInvoiceProductDto,
): EditableReturnImportLine {
  return {
    localId: `${product.productId}-${product.productSku}`,
    productId: product.productId,
    productSku: product.productSku,
    productName: product.productName,
    productUnit: product.productUnit,
    importPrice: String(product.importPrice),
    returnQuantity: "0",
    notes: "",
  };
}
