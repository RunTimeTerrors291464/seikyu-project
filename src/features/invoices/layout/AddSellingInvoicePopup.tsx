"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import { useDict } from "@/lib/lang/DictProvider";
import {
  finalizeMoneyStringTwoDecimalPlaces,
  formatPriceNumber,
  normalizeMoneyStringInput,
} from "@/lib/numeric/integerAndMoneyInputs";
import { AlertTriangle, Boxes, DollarSign, Package } from "lucide-react";
import { useMemo, useState } from "react";
import { useSellingInvoiceCreateEditor } from "../hooks/useSellingInvoiceCreateEditor";
import { createSellingInvoice } from "../services/sellingInvoice.service";
import { toNumberOrZero } from "../types/importInvoiceDetail";
import {
  EditableSellingInvoiceCreateLine,
  sellingCreateLinesToRequest,
} from "../types/sellingInvoiceCreate";
import SellingInvoiceProductsCard from "./SellingInvoiceProductsCard";

type AddSellingInvoicePopupProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (invoiceId: string) => void;
};

type ConfirmAction = "cancel" | "create" | null;
const MAX_PERCENT_DISCOUNT = 100;

function clampPercentDiscount(value: number): number {
  return Math.min(Math.max(value, 0), MAX_PERCENT_DISCOUNT);
}

function normalizePercentDiscountInput(raw: string): string {
  const normalized = normalizeMoneyStringInput(raw, { allowEmpty: true });
  if (normalized === "") {
    return "";
  }
  const numeric = clampPercentDiscount(toNumberOrZero(normalized));
  return normalized.endsWith(".") ? `${numeric}.` : String(numeric);
}

function finalizePercentDiscountInput(raw: string): string {
  const finalized = finalizeMoneyStringTwoDecimalPlaces(raw, { allowEmpty: false });
  return clampPercentDiscount(toNumberOrZero(finalized)).toFixed(2);
}

function createInitialProducts(): EditableSellingInvoiceCreateLine[] {
  return [];
}

export default function AddSellingInvoicePopup({
  open,
  onClose,
  onCreated,
}: AddSellingInvoicePopupProps) {
  const dict = useDict();
  const [products, setProducts] = useState<EditableSellingInvoiceCreateLine[]>(
    createInitialProducts(),
  );
  const [invoiceDiscount, setInvoiceDiscount] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [noteTouched, setNoteTouched] = useState<boolean>(false);
  const [createAttempted, setCreateAttempted] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const nowText = useMemo(() => new Date().toISOString(), []);

  const isDraftDirty = useMemo(
    function computeDraftDirty(): boolean {
      return (
        products.length > 0 ||
        notes.trim().length > 0 ||
        toNumberOrZero(invoiceDiscount) !== 0
      );
    },
    [products, notes, invoiceDiscount],
  );

  const {
    updateRow,
    totals,
    hasInvalidLines,
    draftError,
  } = useSellingInvoiceCreateEditor(products, setProducts, createAttempted);

  function resetDraftState(): void {
    setProducts(createInitialProducts());
    setInvoiceDiscount("0");
    setNotes("");
    setNoteTouched(false);
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
    if (products.length === 0) {
      return;
    }

    if (hasInvalidLines) {
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const created = await createSellingInvoice({
        products: sellingCreateLinesToRequest(products),
        invoiceDiscount:
          toNumberOrZero(invoiceDiscount) > 0
            ? toNumberOrZero(invoiceDiscount)
            : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      handleClose();
      onCreated?.(created.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : dict.somethingWentWrong,
      );
    } finally {
      setCreating(false);
    }
  }

  function handleOpenCreateConfirm(): void {
    setCreateAttempted(true);

    if (products.length === 0) {
      return;
    }

    if (hasInvalidLines) {
      setConfirmAction(null);
      return;
    }

    setConfirmAction("create");
  }

  const noteWarning = (noteTouched || createAttempted) && !notes.trim();
  const invoiceDiscountValue = clampPercentDiscount(toNumberOrZero(invoiceDiscount));

  const sellingPreview = useMemo(
    function computeSellingPreview(): { totalAfterDiscount: number; totalDiscount: number } {
      let totalBeforeDiscount = 0;
      let totalAfterDiscount = 0;

      products.forEach((product) => {
        const quantity = Math.max(0, Math.floor(toNumberOrZero(product.quantity)));
        const unitPrice = Math.max(0, toNumberOrZero(product.sellingPrice));
        const perLineDiscount = clampPercentDiscount(
          toNumberOrZero(product.productDiscount),
        );
        const effectiveDiscount =
          perLineDiscount > 0 ? perLineDiscount : invoiceDiscountValue;
        const lineBeforeDiscount = quantity * unitPrice;
        const lineAfterDiscount =
          lineBeforeDiscount * ((100 - effectiveDiscount) / 100);
        totalBeforeDiscount += lineBeforeDiscount;
        totalAfterDiscount += lineAfterDiscount;
      });

      return {
        totalAfterDiscount,
        totalDiscount: totalBeforeDiscount - totalAfterDiscount,
      };
    },
    [products, invoiceDiscountValue],
  );

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={requestCancel}>
      <div className="flex h-[90vh] w-[90vw] max-w-[1500px] bg-bg flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h1 className="text-sm font-semibold text-text">{dict.sellingDraft}</h1>
          {draftError ? (
            <HeaderMeta
              icon={<AlertTriangle className="h-4 w-4" />}
              label={dict.error}
              value={dict[draftError.key]}
              accent={draftError.accent}
              format="text"
            />
          ) : null}
          <HeaderMeta label={dict.createdDate} value={nowText} />
        </div>

        <div className="flex flex-1 gap-4 flex-col overflow-auto p-5">
          {errorMessage && (
            <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiTile
              label={dict.totalSellingPriceLabel}
              value={formatPriceNumber(sellingPreview.totalAfterDiscount)}
              icon={<DollarSign className="h-4 w-4 text-muted" />}
              accent={sellingPreview.totalAfterDiscount > 0 ? "primary" : "neutral"}
              helpText={dict.totalSellingPriceKpiHelp}
              sub={dict.totalSellingPriceKpiSub}
            />
            <KpiTile
              label={dict.totalDiscountLabel}
              value={formatPriceNumber(sellingPreview.totalDiscount)}
              icon={<DollarSign className="h-4 w-4 text-muted" />}
              accent={sellingPreview.totalDiscount > 0 ? "warning" : "neutral"}
              helpText={dict.totalDiscountKpiHelp}
              sub={dict.totalDiscountKpiSub}
            />
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

          <SellingInvoiceProductsCard
            products={products}
            canEditDraft={true}
            onChangeProducts={setProducts}
            updateRow={updateRow}
          />

          <div className="flex items-start gap-5">
            <div className="w-full max-w-xs shrink-0">
              <Field label={dict.invoiceDiscountLabel} hint={dict.discountPercentHint}>
                <div className="flex items-center gap-1.5">
                  <input
                    className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-text"
                    value={invoiceDiscount}
                    aria-label={dict.invoiceDiscountLabel}
                    onChange={function handleInvoiceDiscount(event): void {
                      setInvoiceDiscount(
                        normalizePercentDiscountInput(event.target.value),
                      );
                    }}
                    onBlur={function handleInvoiceDiscountBlur(): void {
                      setInvoiceDiscount(finalizePercentDiscountInput(invoiceDiscount));
                    }}
                    inputMode="decimal"
                  />
                  <span className="shrink-0 text-sm text-muted" aria-hidden>
                    %
                  </span>
                </div>
              </Field>
            </div>

            <div className="min-w-0 flex-1">
              <Field
                label={dict.noteLabel}
                warning={noteWarning ? dict.emptyDescription : undefined}
              >
                <Textarea
                  value={notes}
                  onChange={setNotes}
                  onBlur={() => setNoteTouched(true)}
                  placeholder={dict.invoiceDescriptionPlaceholder}
                />
              </Field>
            </div>
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
        title={dict.confirmDiscardSellingDraftTitle}
        description={dict.confirmDiscardSellingDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={handleCancelConfirmed}
        onClose={() => setConfirmAction(null)}
        accent="danger"
      />

      <ConfirmPopup
        open={confirmAction === "create"}
        title={dict.confirmCreateSellingInvoiceTitle}
        description={dict.confirmCreateSellingInvoiceDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={creating}
        onConfirm={handleCreateConfirmed}
        onClose={() => setConfirmAction(null)}
      />
    </Popup>
  );
}
