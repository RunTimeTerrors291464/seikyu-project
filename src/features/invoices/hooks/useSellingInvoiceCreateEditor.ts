"use client";

import { INVOICE_DRAFT_ERRORS } from "@/components/types/ui";
import { useCallback, useMemo } from "react";
import { toNumberOrZero } from "../types/importInvoiceDetail";
import type { EditableSellingInvoiceCreateLine } from "../types/sellingInvoiceCreate";

type SellingInvoiceCreateDraftError =
  (typeof INVOICE_DRAFT_ERRORS)[keyof typeof INVOICE_DRAFT_ERRORS];

export type SellingInvoiceCreateTotals = {
  totalProducts: number;
  totalQuantity: number;
};

/**
 * Validation and row updates for creating a selling invoice (cashier popup).
 *
 * @param products - Current editable rows.
 * @param onChangeProducts - Replaces the full products array.
 * @param validationActive - When false, `draftError` is always null.
 * @returns Row updater, totals, validation flags, and structured draft error for the header.
 */
export function useSellingInvoiceCreateEditor(
  products: EditableSellingInvoiceCreateLine[],
  onChangeProducts: (next: EditableSellingInvoiceCreateLine[]) => void,
  validationActive: boolean,
): {
  updateRow: (
    rowLocalId: string,
    key: keyof EditableSellingInvoiceCreateLine,
    value: string,
  ) => void;
  totals: SellingInvoiceCreateTotals;
  hasInvalidLines: boolean;
  draftError: SellingInvoiceCreateDraftError | null;
} {
  const updateRow = useCallback(
    function updateRow(
      rowLocalId: string,
      key: keyof EditableSellingInvoiceCreateLine,
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

  const hasInvalidLines = useMemo(
    function computeHasInvalidLines(): boolean {
      return products.some(
        (product) =>
          product.productSku.trim().length === 0 ||
          toNumberOrZero(product.quantity) <= 0,
      );
    },
    [products],
  );

  const draftError = useMemo(
    function computeDraftError(): SellingInvoiceCreateDraftError | null {
      if (!validationActive) {
        return null;
      }

      const hasEmptySku = products.some(
        (product) => product.productSku.trim().length === 0,
      );
      if (hasEmptySku) {
        return INVOICE_DRAFT_ERRORS.sellingMissingSku;
      }

      const hasInvalidQuantity = products.some(
        (product) => toNumberOrZero(product.quantity) <= 0,
      );
      if (hasInvalidQuantity) {
        return INVOICE_DRAFT_ERRORS.importMissingQuantity;
      }

      return null;
    },
    [validationActive, products],
  );

  const totals = useMemo(
    function computeTotals(): SellingInvoiceCreateTotals {
      let totalQuantity = 0;

      products.forEach((product) => {
        const quantity = toNumberOrZero(product.quantity);
        totalQuantity += quantity;
      });

      return {
        totalProducts: products.length,
        totalQuantity,
      };
    },
    [products],
  );

  return {
    updateRow,
    totals,
    hasInvalidLines,
    draftError,
  };
}
