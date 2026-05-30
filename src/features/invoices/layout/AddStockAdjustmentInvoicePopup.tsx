"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import { INVOICE_DRAFT_ERRORS } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { AlertTriangle, Boxes, Package } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { STOCK_ADJUSTMENT_REASON_CATEGORY_OPTIONS } from "../filters/stockAdjustmentInvoiceFilters";
import { useStockAdjustmentInvoiceProductsEditor } from "../hooks/useStockAdjustmentInvoiceProductsEditor";
import {
  createStockAdjustmentInvoiceDraft,
  type StockAdjustmentReasonCategory,
} from "../services/stockAdjustmentInvoice.service";
import {
  buildStockAdjustmentProductRequests,
  EditableStockAdjustmentLine,
} from "../types/stockAdjustmentDetail";
import StockAdjustmentProductsCard from "./StockAdjustmentProductsCard";

type AddStockAdjustmentInvoicePopupProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (invoiceId: string) => void;
};

type ConfirmAction = "cancel" | "create" | null;

function createInitialProducts(): EditableStockAdjustmentLine[] {
  return [];
}

export default function AddStockAdjustmentInvoicePopup({
  open,
  onClose,
  onCreated,
}: AddStockAdjustmentInvoicePopupProps) {
  const dict = useDict();
  const [products, setProducts] = useState<EditableStockAdjustmentLine[]>(
    createInitialProducts(),
  );
  const [reasonCategory, setReasonCategory] =
    useState<StockAdjustmentReasonCategory>("damage");
  const [notes, setNotes] = useState<string>("");
  const [createAttempted, setCreateAttempted] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const nowText = useMemo(() => new Date().toISOString(), [open]);
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
    hasInvalidLines,
    draftError,
  } = useStockAdjustmentInvoiceProductsEditor({
    products,
    onChangeProducts: setProducts,
    validationActive: createAttempted,
  });

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
    setReasonCategory("damage");
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

  function requestCancel(): void {
    if (isDraftDirty) {
      setConfirmAction("cancel");
      return;
    }

    setConfirmAction(null);
    handleClose();
  }

  async function handleCreateConfirmed(): Promise<void> {
    if (products.length === 0 || hasInvalidLines || draftError) {
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const created = await createStockAdjustmentInvoiceDraft({
        products: buildStockAdjustmentProductRequests(products, reasonCategory),
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

    if (hasInvalidLines || draftError) {
      setConfirmAction(null);
      return;
    }

    setErrorMessage("");
    setConfirmAction("create");
  }

  const noteWarning = createAttempted && !notes.trim();

  const productsCardDangerAccent =
    createAttempted && products.length === 0;

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={requestCancel}>
      <div className="flex h-[90vh] w-[92vw] max-w-[1200px] flex-col overflow-hidden bg-bg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h1 className="shrink-0 text-sm font-semibold text-text">
            {dict.stockAdjustmentDraft}
          </h1>
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

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <KpiTile
              label={dict.totalProducts}
              value={totals.totalProducts.toLocaleString()}
              icon={<Package className="h-4 w-4 text-muted" />}
              accent={totals.totalProducts === 0 ? "warning" : "neutral"}
              helpText={dict.totalProductsKpiHelp}
              sub={dict.totalProductsKpiSub}
            />
            <KpiTile
              label={dict.totalQuantity}
              value={totals.totalQuantity.toLocaleString()}
              icon={<Boxes className="h-4 w-4 text-muted" />}
              accent={totals.totalQuantity === 0 ? "warning" : "neutral"}
              helpText={dict.totalQuantityKpiHelp}
              sub={dict.totalQuantityKpiSub}
            />
          </div>

          <StockAdjustmentProductsCard
            products={products}
            canEditDraft={true}
            onChangeProducts={setProducts}
            updateRow={updateRow}
            accent={productsCardDangerAccent ? "danger" : "neutral"}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
            <Field label={dict.actionReasonLabel}>
              <select
                value={reasonCategory}
                onChange={function handleReasonChange(event): void {
                  setReasonCategory(
                    event.target.value as StockAdjustmentReasonCategory,
                  );
                }}
                className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-text outline-none"
              >
                {STOCK_ADJUSTMENT_REASON_CATEGORY_OPTIONS.map(function renderOption(option) {
                  return (
                    <option key={option.value} value={option.value}>
                      {dict[option.dictKey as keyof typeof dict] ?? option.value}
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field
              label={dict.noteLabel}
              warning={noteWarning ? dict.emptyDescription : undefined}
            >
              <Textarea
                value={notes}
                onChange={setNotes}
                placeholder={dict.invoiceDescriptionPlaceholder}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
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
        title={dict.confirmDiscardStockAdjustmentDraftTitle}
        description={dict.confirmDiscardStockAdjustmentDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={handleCancelConfirmed}
        onClose={() => setConfirmAction(null)}
        accent="danger"
      />

      <ConfirmPopup
        open={confirmAction === "create"}
        title={dict.confirmCreateStockAdjustmentDraftTitle}
        description={dict.confirmCreateStockAdjustmentDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={creating}
        onConfirm={handleCreateConfirmed}
        onClose={() => setConfirmAction(null)}
      />
    </Popup>
  );
}
