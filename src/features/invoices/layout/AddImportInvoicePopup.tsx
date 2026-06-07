"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import { INVOICE_DRAFT_ERRORS } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useImportInvoiceProductsEditor } from "../hooks/useImportInvoiceProductsEditor";
import { createImportInvoiceDraft } from "../services/importInvoice.service";
import {
  EditableImportInvoiceProduct,
  importCreateLinesToRequest,
} from "../types/importInvoiceDetail";
import ImportInvoiceDraftWorkspace from "./ImportInvoiceDraftWorkspace";

type AddImportInvoicePopupProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Called after a draft is created successfully with the new invoice row id.
   */
  onCreated?: (invoiceId: string) => void;
};

type ConfirmAction = "cancel" | "create" | null;

function createInitialProducts(): EditableImportInvoiceProduct[] {
  return [];
}

export default function AddImportInvoicePopup({
  open,
  onClose,
  onCreated,
}: AddImportInvoicePopupProps) {
  const dict = useDict();
  const [products, setProducts] = useState<EditableImportInvoiceProduct[]>(
    createInitialProducts(),
  );
  const [notes, setNotes] = useState<string>("");
  const [createAttempted, setCreateAttempted] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const nowText = useMemo(() => new Date().toISOString(), []);
  const previousProductCountRef = useRef<number>(0);

  const isDraftDirty = useMemo(
    function computeDraftDirty(): boolean {
      return products.length > 0 || notes.trim().length > 0;
    },
    [products, notes],
  );

  const {
    updateRow,
    totals,
    hasEmptyQuantityOrImportPrice,
    draftError,
  } = useImportInvoiceProductsEditor(products, setProducts, createAttempted);

  const noProductsMessage = dict[INVOICE_DRAFT_ERRORS.draftNoProducts.key];

  useEffect(
    function onProductLineCountChange(): void {
      const previousCount = previousProductCountRef.current;
      previousProductCountRef.current = products.length;

      if (previousCount === 0 && products.length > 0) {
        setCreateAttempted(false);
        setErrorMessage(function clearNoProductsValidation(previous): string {
          return previous === noProductsMessage ? "" : previous;
        });
      }
    },
    [products.length, noProductsMessage],
  );

  function resetDraftState(): void {
    previousProductCountRef.current = 0;
    setProducts(createInitialProducts());
    setNotes("");
    setCreateAttempted(false);
    setConfirmAction(null);
    setCreating(false);
    setErrorMessage("");
  }

  function handleClose(): void {
    resetDraftState();
    onClose();
  }

  function handleCancelConfirmed(): void {
    handleClose();
  }

  /**
   * Handles closing/discarding the popup.
   *
   * Only shows the discard confirmation when the user has provided input.
   */
  function requestCancel(): void {
    if (isDraftDirty) {
      setConfirmAction("cancel");
      return;
    }

    setConfirmAction(null);
    handleClose();
  }

  async function handleCreateConfirmed(): Promise<void> {
    if (products.length === 0) {
      return;
    }

    if (hasEmptyQuantityOrImportPrice) {
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const created = await createImportInvoiceDraft({
        products: importCreateLinesToRequest(products),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      handleClose();
      onCreated?.(created.id);
    } catch (error) {
      setErrorMessage(resolveApiErrorMessage(error, dict));
    } finally {
      setCreating(false);
    }
  }

  function handleOpenCreateConfirm(): void {
    setCreateAttempted(true);

    if (products.length === 0) {
      setErrorMessage(noProductsMessage);
      setConfirmAction(null);
      return;
    }

    if (hasEmptyQuantityOrImportPrice) {
      setConfirmAction(null);
      return;
    }

    setErrorMessage("");
    setConfirmAction("create");
  }

  const productsCardDangerAccent =
    createAttempted && products.length === 0 ? "danger" : "neutral";

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={requestCancel}>
      <div className="flex h-[90vh] w-[90vw] max-w-[1500px] bg-bg flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="text-xl shrink-0 font-semibold text-text">
            {dict.importDraft}
          </p>
          <div className="flex min-w-0 flex-1 justify-center px-2">
            {draftError != null ? (
              <HeaderMeta
                icon={<AlertTriangle className="h-4 w-4" />}
                label={dict.error}
                value={dict[draftError.key]}
                accent={draftError.accent}
                format="text"
              />
            ) : errorMessage ? (
              <HeaderMeta
                icon={<AlertTriangle className="h-4 w-4" />}
                label={dict.error}
                value={errorMessage}
                accent="danger"
                format="text"
              />
            ) : null}
          </div>
          <div className="shrink-0">
            <HeaderMeta label={dict.createdDate} value={nowText} />
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-auto px-4 py-3">
          <ImportInvoiceDraftWorkspace
            products={products}
            onChangeProducts={setProducts}
            notes={notes}
            onNotesChange={setNotes}
            updateRow={updateRow}
            totals={totals}
            lineFieldValidationActive={createAttempted}
            productsCardAccent={productsCardDangerAccent}
            disableDuplicateProductCheck={true}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button accent="neutral" onClick={requestCancel}>
            {dict.cancel}
          </Button>
          <Button accent="primary" onClick={handleOpenCreateConfirm}>
            {dict.create}
          </Button>
        </div>
      </div>

      <ConfirmPopup
        open={confirmAction === "cancel"}
        title={dict.confirmDiscardImportDraftTitle}
        description={dict.confirmDiscardImportDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={handleCancelConfirmed}
        onClose={() => setConfirmAction(null)}
        accent="danger"
      />

      <ConfirmPopup
        open={confirmAction === "create"}
        title={dict.confirmCreateImportDraftTitle}
        description={dict.confirmCreateImportDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={creating}
        onConfirm={handleCreateConfirmed}
        onClose={() => setConfirmAction(null)}
      />
    </Popup>
  );
}
