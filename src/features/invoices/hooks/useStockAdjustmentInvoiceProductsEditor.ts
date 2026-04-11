"use client";

import { INVOICE_DRAFT_ERRORS } from "@/components/types/ui";
import { useCallback, useMemo } from "react";
import {
  EditableStockAdjustmentLine,
  toNumberOrZero,
} from "../types/stockAdjustmentDetail";

type StockAdjustmentDraftError =
  (typeof INVOICE_DRAFT_ERRORS)[keyof typeof INVOICE_DRAFT_ERRORS];

export type StockAdjustmentProductsTotals = {
  totalProducts: number;
  totalQuantity: number;
};

type Params = {
  products: EditableStockAdjustmentLine[];
  onChangeProducts: (next: EditableStockAdjustmentLine[]) => void;
  validationActive: boolean;
};

/**
 * Draft-line editing helpers for stock adjustment invoice products (create popup + detail page).
 *
 * @param products - Current editable rows.
 * @param onChangeProducts - Replaces the full products array.
 * @param validationActive - When false, `draftError` is always null.
 * @returns Row updater, totals, validation flags, and structured draft error for the header.
 */
export function useStockAdjustmentInvoiceProductsEditor({
  products,
  onChangeProducts,
  validationActive,
}: Params): {
  updateRow: (
    rowLocalId: string,
    key: keyof EditableStockAdjustmentLine,
    value: string,
  ) => void;
  totals: StockAdjustmentProductsTotals;
  hasInvalidLines: boolean;
  draftError: StockAdjustmentDraftError | null;
} {
  const updateRow = useCallback(
    function updateRow(
      rowLocalId: string,
      key: keyof EditableStockAdjustmentLine,
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
        (product) => toNumberOrZero(product.quantity) <= 0,
      );
    },
    [products],
  );

  const draftError = useMemo(
    function computeDraftError(): StockAdjustmentDraftError | null {
      if (!validationActive) {
        return null;
      }

      const hasInvalidQuantity = products.some(
        (product) => toNumberOrZero(product.quantity) <= 0,
      );
      if (hasInvalidQuantity) {
        return INVOICE_DRAFT_ERRORS.stockAdjustmentMissingQuantity;
      }

      return null;
    },
    [validationActive, products],
  );

  const totals = useMemo(
    function computeTotals(): StockAdjustmentProductsTotals {
      let totalQuantity = 0;

      products.forEach((product) => {
        totalQuantity += toNumberOrZero(product.quantity);
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
