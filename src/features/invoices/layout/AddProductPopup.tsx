"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Fields";
import type { AddExistingProductsColumnPreset } from "@/features/invoices/table/addExistingProductsColumns";
import useSkuLookupValidation from "@/features/products/hooks/useSkuLookupValidation";
import type { Product } from "@/features/products/types/product";
import useFocusFirstFormControlOnOpen from "@/lib/hooks/useFocusFirstFormControlOnOpen";
import { useDict } from "@/lib/lang/DictProvider";
import useShortcut from "@/lib/shortcuts/useShortcut";
import {
  INVOICE_ADD_PRODUCT_NEW_SHORTCUT_FALLBACK_LABEL,
  INVOICE_ADD_PRODUCT_NEW_SHORTCUT_ID,
  INVOICE_ADD_PRODUCT_NEW_SHORTCUT_PRIORITY,
  UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
  UNIVERSAL_NEW_SHORTCUT_CHORD,
} from "@/lib/shortcuts/universalShortcut";
import { Barcode } from "lucide-react";
import { useCallback, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import AddExistingProductsPopup from "./AddExistingProductsPopup";

type AddProductPopupProps = {
  open: boolean;
  onClose: () => void;
  onOpenRequest: () => void;
  /** When true, Ctrl+. opens this popup (while it and the bulk picker are closed). */
  newShortcutEnabled?: boolean;
  excludedProductIds: Set<string>;
  onConfirmAdd: (product: Product) => void;
  onConfirmAddMultiple: (products: Product[]) => void;
  addExistingDialogTitle?: string;
  productNameColumnWidthPx?: number;
  productPickerColumnPreset?: AddExistingProductsColumnPreset;
};

/**
 * Single-SKU add dialog with optional bulk picker (`AddExistingProductsPopup`).
 *
 * @param props - Open state, exclusions, and confirm handlers.
 * @returns Popup tree or null when closed.
 */
export default function AddProductPopup({
  open,
  onClose,
  onOpenRequest,
  newShortcutEnabled = false,
  excludedProductIds,
  onConfirmAdd,
  onConfirmAddMultiple,
  addExistingDialogTitle,
  productNameColumnWidthPx,
  productPickerColumnPreset,
}: AddProductPopupProps) {
  const dict = useDict();
  const [openBulkPicker, setOpenBulkPicker] = useState(false);

  const handleNewShortcut = useCallback(function handleNewShortcut(): void {
    onOpenRequest();
  }, [onOpenRequest]);

  useShortcut({
    id: INVOICE_ADD_PRODUCT_NEW_SHORTCUT_ID,
    chord: UNIVERSAL_NEW_SHORTCUT_CHORD,
    label: INVOICE_ADD_PRODUCT_NEW_SHORTCUT_FALLBACK_LABEL,
    handler: handleNewShortcut,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    enabled: newShortcutEnabled && !open && !openBulkPicker,
    priority: INVOICE_ADD_PRODUCT_NEW_SHORTCUT_PRIORITY,
  });
  const [sku, setSku] = useState("");
  const [touched, setTouched] = useState(false);
  const formFieldsRef = useFocusFirstFormControlOnOpen({ when: open });

  const {
    isDebouncing: skuDebouncing,
    checking: skuChecking,
    product: resolvedProduct,
    notFound: skuNotFound,
  } = useSkuLookupValidation({ sku, skip: !open });

  const getSkuFieldError = useCallback(
    function getSkuFieldError(value: string): string {
      if (!value || !/^\d{13}$/.test(value)) {
        return dict.skuMustBe13;
      }

      if (skuDebouncing || skuChecking) {
        return "";
      }

      if (skuNotFound) {
        return dict.skuProductNotFound;
      }

      if (resolvedProduct && !resolvedProduct.isActive) {
        return dict.productInactiveCannotAdd;
      }

      if (resolvedProduct && excludedProductIds.has(resolvedProduct.id)) {
        return dict.productAlreadyOnInvoice;
      }

      return "";
    },
    [
      dict,
      excludedProductIds,
      resolvedProduct,
      skuChecking,
      skuDebouncing,
      skuNotFound,
    ],
  );

  const skuError = useMemo(
    function computeSkuError(): string {
      if (!touched && sku.length === 0) {
        return "";
      }

      return getSkuFieldError(sku);
    },
    [getSkuFieldError, sku, touched],
  );

  const canAdd =
    /^\d{13}$/.test(sku) &&
    !skuDebouncing &&
    !skuChecking &&
    resolvedProduct !== null &&
    resolvedProduct.isActive &&
    !excludedProductIds.has(resolvedProduct.id) &&
    getSkuFieldError(sku) === "";

  function resetSkuForm(): void {
    setSku("");
    setTouched(false);
  }

  function handleClose(): void {
    resetSkuForm();
    onClose();
  }

  function handleSkuChange(value: string): void {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    setSku(digits);
  }

  function handleSkuBlur(): void {
    setTouched(true);
  }

  function handleSkuKeyDown(event: ReactKeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleAddProduct();
  }

  function handleAddProduct(): void {
    if (!canAdd || !resolvedProduct) {
      return;
    }

    onConfirmAdd(resolvedProduct);
    resetSkuForm();
    onClose();
  }

  function handleOpenBulkPicker(): void {
    resetSkuForm();
    onClose();
    setOpenBulkPicker(true);
  }

  function handleBulkConfirm(products: Product[]): void {
    onConfirmAddMultiple(products);
    setOpenBulkPicker(false);
  }

  function handleBulkClose(): void {
    setOpenBulkPicker(false);
  }

  if (!open && !openBulkPicker) {
    return null;
  }

  const skuHint = skuDebouncing || skuChecking ? dict.checkingSku : undefined;
  const hasSkuError = skuError.length > 0;

  return (
    <>
      {open ? (
        <Popup open={open} onClose={handleClose}>
          <div ref={formFieldsRef} className="flex w-[min(100%,24rem)] flex-col bg-bg">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-text">{dict.addProduct}</h2>
              <Button accent="neutral" onClick={handleOpenBulkPicker}>
                {dict.addMultipleProducts}
              </Button>
            </div>

            <div className="px-4 py-4">
              <div className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 pt-2 text-xs text-muted">
                  <Barcode className="h-3 w-3" />
                  {dict.sku}
                </span>
                <div className="min-w-0 space-y-1">
                  <Input
                    value={sku}
                    onChange={handleSkuChange}
                    onBlur={handleSkuBlur}
                    onKeyDown={handleSkuKeyDown}
                    aria-label={dict.sku}
                    error={hasSkuError || undefined}
                  />
                  {hasSkuError ? (
                    <p className="text-xs text-danger">{skuError}</p>
                  ) : skuHint ? (
                    <p className="text-xs text-muted">{skuHint}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <Button accent="neutral" onClick={handleClose}>
                {dict.cancel}
              </Button>
              <Button accent="primary" onClick={handleAddProduct} disabled={!canAdd}>
                {dict.add}
              </Button>
            </div>
          </div>
        </Popup>
      ) : null}

      <AddExistingProductsPopup
        open={openBulkPicker}
        onClose={handleBulkClose}
        excludedProductIds={excludedProductIds}
        onConfirmSelect={handleBulkConfirm}
        dialogTitle={addExistingDialogTitle}
        productNameColumnWidthPx={productNameColumnWidthPx}
        productPickerColumnPreset={productPickerColumnPreset}
      />
    </>
  );
}
