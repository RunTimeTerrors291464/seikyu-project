import type { Product } from "@/features/products/types/product";
import { createInvoiceLineLocalId } from "../lib/createInvoiceLineLocalId";

const PRODUCT_STUB_TIMESTAMP = "1970-01-01T00:00:00.000Z";
import type {
  SellingInvoiceProductDto,
  SellingInvoiceProductLineRequestDto,
} from "../services/sellingInvoice.service";
import { toNumberOrZero } from "./importInvoiceDetail";

export type EditableSellingInvoiceCreateLine = {
  localId: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  sellingPrice: string;
  quantity: string;
  productDiscount: string;
  totalSellingPrice: string;
  notes: string;
};

/**
 * Maps a catalog product to an editable selling invoice draft line (SKU-based create payload).
 *
 * @param product - Product from the catalog API.
 * @param nameFallback - Label when the product has no primary name.
 * @returns Editable row with a fresh `localId` and zero quantity/discount.
 */
/**
 * Builds a minimal catalog `Product` from a draft line so the entry card can edit without SKU lookup.
 *
 * @param line - Existing selling draft row.
 * @returns Product stub for {@link useInvoiceProductLineEntry} edit mode.
 */
export function editableSellingLineToProductStub(
  line: EditableSellingInvoiceCreateLine,
): Product {
  return {
    id: line.productId,
    sku: line.productSku,
    productNames: [line.productName],
    productUnitId: "",
    productUnitName: line.productUnit,
    productDescription: "",
    importPrice: 0,
    sellingPrice: Math.max(0, toNumberOrZero(line.sellingPrice)),
    inventoryStock: 0,
    reorderThreshold: 0,
    isActive: true,
    stockStatus: 0,
    createdAt: PRODUCT_STUB_TIMESTAMP,
    updatedAt: PRODUCT_STUB_TIMESTAMP,
  };
}

export function productToEditableSellingCreateLine(
  product: Product,
  nameFallback: string,
): EditableSellingInvoiceCreateLine {
  return {
    localId: createInvoiceLineLocalId(product.id),
    productId: product.id,
    productSku: product.sku,
    productName: product.productNames?.[0] ?? nameFallback,
    productUnit: product.productUnitName,
    sellingPrice: String(product.sellingPrice),
    quantity: "0",
    productDiscount: "0",
    totalSellingPrice: "0",
    notes: "",
  };
}

/**
 * Maps a catalog product to a selling line with default quantity 1 (catalog append flow).
 *
 * @param product - Product from the catalog API.
 * @param nameFallback - Label when the product has no primary name.
 * @returns Editable row ready for the read-only products table.
 */
export function catalogProductToEditableSellingCreateLine(
  product: Product,
  nameFallback: string,
): EditableSellingInvoiceCreateLine {
  const line = productToEditableSellingCreateLine(product, nameFallback);
  return {
    ...line,
    quantity: "1",
    totalSellingPrice: String(product.sellingPrice),
  };
}

/**
 * Maps an API selling line DTO to read-only display row (detail view uses server totals).
 *
 * @param product - Line from `getSellingInvoiceById`.
 * @returns Editable-shaped row for display tables that do not edit prices.
 */
export function sellingLineDtoToEditableDisplay(
  product: SellingInvoiceProductDto,
): EditableSellingInvoiceCreateLine {
  return {
    localId: product.id,
    productId: product.productId,
    productSku: product.productSku,
    productName: product.productName,
    productUnit: product.productUnit,
    sellingPrice: String(product.sellingPrice),
    quantity: String(product.quantity),
    productDiscount: String(product.productDiscount),
    totalSellingPrice: String(product.totalSellingPrice),
    notes: product.notes ?? "",
  };
}

/**
 * Builds payload lines for `createSellingInvoice` from editable draft rows.
 *
 * @param lines - Current draft rows from the create popup.
 * @returns Request body product lines (SKU, quantity, discount, notes).
 */
export function sellingCreateLinesToRequest(
  lines: EditableSellingInvoiceCreateLine[],
): SellingInvoiceProductLineRequestDto[] {
  return lines.map((line) => ({
    productSku: line.productSku.trim(),
    productName: line.productName.trim(),
    productUnit: line.productUnit.trim(),
    quantity: Math.floor(toNumberOrZero(line.quantity)),
    sellingPrice: Math.max(0, toNumberOrZero(line.sellingPrice)),
    productDiscount: toNumberOrZero(line.productDiscount),
    notes: line.notes.trim() || undefined,
  }));
}
