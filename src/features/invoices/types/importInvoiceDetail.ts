import type { Product } from "@/features/products/types/product";
import { parseMoneyLikeString } from "@/lib/numeric/integerAndMoneyInputs";

const PRODUCT_STUB_TIMESTAMP = "1970-01-01T00:00:00.000Z";
import {
  type ImportInvoiceProductDto,
  type ImportInvoiceProductRequestDto,
  parseImportInvoiceMoney,
} from "../services/importInvoice.service";

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
 * Builds a minimal catalog `Product` from a draft line so the entry card can edit without SKU lookup.
 *
 * @param line - Existing import draft row.
 * @returns Product stub for {@link useInvoiceProductLineEntry} edit mode.
 */
export function editableImportLineToProductStub(
  line: EditableImportInvoiceProduct,
): Product {
  return {
    id: line.productId,
    sku: line.productSku,
    productNames: [line.productName],
    productUnitId: "",
    productUnitName: line.productUnit,
    productDescription: "",
    importPrice: Math.max(0, toNumberOrZero(line.importPrice)),
    sellingPrice: 0,
    inventoryStock: 0,
    reorderThreshold: 0,
    isActive: true,
    stockStatus: 0,
    createdAt: PRODUCT_STUB_TIMESTAMP,
    updatedAt: PRODUCT_STUB_TIMESTAMP,
  };
}

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
    importPrice: String(parseImportInvoiceMoney(product.importPrice)),
    notes: product.notes ?? "",
  };
}

/**
 * Builds request lines for create/edit import invoice from editable draft rows.
 *
 * @param lines - Current editable product rows.
 * @returns Payload product lines for the v2 import invoice API.
 */
export function importCreateLinesToRequest(
  lines: EditableImportInvoiceProduct[],
): ImportInvoiceProductRequestDto[] {
  return lines.map((line) => ({
    productId: line.productId,
    productSku: line.productSku.trim(),
    productName: line.productName.trim(),
    productUnit: line.productUnit.trim(),
    quantity: Math.floor(toNumberOrZero(line.quantity)),
    importPrice: toNumberOrZero(line.importPrice),
    notes: line.notes.trim() || undefined,
  }));
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
