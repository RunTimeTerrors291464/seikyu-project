import { ImportInvoiceProductDto } from "../services/importInvoice.service";

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

export function toEditableProduct(
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

export function toNumberOrZero(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

