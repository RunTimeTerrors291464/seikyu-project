"use client";

import { INVOICE_DRAFT_ERRORS } from "@/components/types/ui";
import { useCallback, useMemo } from "react";
import {
  EditableImportInvoiceProduct,
  toNumberOrZero,
} from "../types/importInvoiceDetail";

type ImportInvoiceDraftError =
  (typeof INVOICE_DRAFT_ERRORS)[keyof typeof INVOICE_DRAFT_ERRORS];

export type ImportInvoiceProductsTotals = {
  totalProducts: number;
  totalQuantity: number;
  totalImportPrice: number;
};

/**
 * Shared draft-line editing helpers for import invoice products (create popup + detail page).
 *
 * @param products - Current editable rows.
 * @param onChangeProducts - Replaces the full products array (same as `setProducts`).
 * @param validationActive - When false, `draftError` is always null. Use `createAttempted` on the create popup and `canEditDraft` on the detail page.
 * @returns Row updater, totals, validation flags, and structured draft error for the header.
 */
export function useImportInvoiceProductsEditor(
  products: EditableImportInvoiceProduct[],
  onChangeProducts: (next: EditableImportInvoiceProduct[]) => void,
  validationActive: boolean,
): {
  updateRow: (
    rowLocalId: string,
    key: keyof EditableImportInvoiceProduct,
    value: string,
  ) => void;
  totals: ImportInvoiceProductsTotals;
  hasEmptyQuantityOrImportPrice: boolean;
  draftError: ImportInvoiceDraftError | null;
} {
  const updateRow = useCallback(
    function updateRow(
      rowLocalId: string,
      key: keyof EditableImportInvoiceProduct,
      value: string,
    ): void {
      onChangeProducts(
        products.map((product) =>
          product.localId === rowLocalId
            ? { ...product, [key]: value }
            : product,
        ),
      );
    },
    [products, onChangeProducts],
  );

  const hasEmptyQuantityOrImportPrice = useMemo(
    function computeHasEmptyQuantityOrImportPrice(): boolean {
      return products.some(
        (product) =>
          toNumberOrZero(product.quantity) <= 0 ||
          product.importPrice.trim().length === 0,
      );
    },
    [products],
  );

  const draftError = useMemo(
    function computeDraftError(): ImportInvoiceDraftError | null {
      if (!validationActive) {
        return null;
      }

      const hasInvalidQuantity = products.some(
        (product) => toNumberOrZero(product.quantity) <= 0,
      );
      if (hasInvalidQuantity) {
        return INVOICE_DRAFT_ERRORS.importMissingQuantity;
      }

      const hasEmptyPrice = products.some(
        (product) => product.importPrice.trim().length === 0,
      );
      if (hasEmptyPrice) {
        return INVOICE_DRAFT_ERRORS.importMissingPrice;
      }

      return null;
    },
    [validationActive, products],
  );

  const totals = useMemo(
    function computeTotals(): ImportInvoiceProductsTotals {
      let totalQuantity = 0;
      let totalImportPrice = 0;

      products.forEach((product) => {
        const quantity = toNumberOrZero(product.quantity);
        const importPrice = toNumberOrZero(product.importPrice);

        totalQuantity += quantity;
        totalImportPrice += quantity * importPrice;
      });

      return {
        totalProducts: products.length,
        totalQuantity,
        totalImportPrice,
      };
    },
    [products],
  );

  return {
    updateRow,
    totals,
    hasEmptyQuantityOrImportPrice,
    draftError,
  };
}
