"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Fields";
import {
  getInvoiceSkuCheckingHint,
  getInvoiceSkuDisplayError,
  getInvoiceSkuFieldError,
  isInvoiceSkuValidated,
  normalizeInvoiceSkuInput,
} from "@/features/invoices/lib/invoiceSkuFieldValidation";
import type { AddExistingProductsColumnPreset } from "@/features/invoices/table/addExistingProductsColumns";
import useSkuCheck from "@/features/products/hooks/useSkuCheck";
import type { Product } from "@/features/products/types/product";
import { useMayUseManagerWorkflowControls } from "@/lib/hooks/useManagerWorkflowAccess";
import useFocusFirstFormControlOnOpen from "@/lib/hooks/useFocusFirstFormControlOnOpen";
import { useDict } from "@/lib/lang/DictProvider";
import {
  INVOICE_ADD_PRODUCT_NEW_SHORTCUT_FALLBACK_LABEL,
  INVOICE_ADD_PRODUCT_NEW_SHORTCUT_ID,
  INVOICE_ADD_PRODUCT_NEW_SHORTCUT_PRIORITY,
  UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
  UNIVERSAL_NEW_SHORTCUT_CHORD,
} from "@/lib/shortcuts/universalShortcut";
import useShortcut from "@/lib/shortcuts/useShortcut";
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
  const canAddMultipleProducts = useMayUseManagerWorkflowControls();
  const [openBulkPicker, setOpenBulkPicker] = useState(false);
  const bulkPickerOpen = canAddMultipleProducts && openBulkPicker;

  const handleNewShortcut = useCallback(function handleNewShortcut(): void {
    onOpenRequest();
  }, [onOpenRequest]);

  useShortcut({
    id: INVOICE_ADD_PRODUCT_NEW_SHORTCUT_ID,
    chord: UNIVERSAL_NEW_SHORTCUT_CHORD,
    label: INVOICE_ADD_PRODUCT_NEW_SHORTCUT_FALLBACK_LABEL,
    handler: handleNewShortcut,
    allowInEditable: UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE,
    enabled: newShortcutEnabled && !open && !bulkPickerOpen,
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
  } = useSkuCheck({ sku, skip: !open, intent: "lookupExisting" });

  const skuLookupState = useMemo(
    function buildSkuLookupState() {
      return {
        sku,
        skuDebouncing,
        skuChecking,
        skuNotFound,
        resolvedProduct,
        excludedProductIds,
      };
    },
    [
      sku,
      skuDebouncing,
      skuChecking,
      skuNotFound,
      resolvedProduct,
      excludedProductIds,
    ],
  );

  const getSkuFieldError = useCallback(
    function resolveSkuFieldError(value: string): string {
      return getInvoiceSkuFieldError(value, skuLookupState, dict);
    },
    [dict, skuLookupState],
  );

  const skuError = useMemo(
    function computeSkuError(): string {
      return getInvoiceSkuDisplayError(sku, touched, getSkuFieldError);
    },
    [getSkuFieldError, sku, touched],
  );

  const canAdd = isInvoiceSkuValidated(sku, skuLookupState, dict);

  function resetSkuForm(): void {
    setSku("");
    setTouched(false);
  }

  function handleClose(): void {
    resetSkuForm();
    onClose();
  }

  function handleSkuChange(value: string): void {
    setSku(normalizeInvoiceSkuInput(value));
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
    if (!canAddMultipleProducts) {
      return;
    }

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

  if (!open && !bulkPickerOpen) {
    return null;
  }

  const skuHint = getInvoiceSkuCheckingHint(sku, skuDebouncing, skuChecking, dict);
  const hasSkuError = skuError.length > 0;

  return (
    <>
      {open ? (
        <Popup open={open} onClose={handleClose}>
          <div ref={formFieldsRef} className="flex w-[min(100%,24rem)] flex-col bg-bg">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-text">{dict.addProduct}</h2>
              {canAddMultipleProducts ? (
                <Button accent="neutral" onClick={handleOpenBulkPicker}>
                  {dict.addMultipleProducts}
                </Button>
              ) : null}
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
        open={bulkPickerOpen}
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
