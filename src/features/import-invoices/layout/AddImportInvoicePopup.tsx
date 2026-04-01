"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import { useDict } from "@/lib/lang/DictProvider";
import { Boxes, DollarSign, Package } from "lucide-react";
import { useMemo, useState } from "react";
import { createImportInvoiceDraft } from "../services/importInvoice.service";
import {
  EditableImportInvoiceProduct,
  toNumberOrZero,
} from "../types/importInvoiceDetail";
import ImportInvoiceProductsCard from "./ImportInvoiceProductsCard";

type AddImportInvoicePopupProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
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
  const [noteTouched, setNoteTouched] = useState<boolean>(false);
  const [createAttempted, setCreateAttempted] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const nowText = useMemo(() => new Date().toISOString(), [open]);

  const totals = useMemo(() => {
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
  }, [products]);

  function resetDraftState(): void {
    setProducts(createInitialProducts());
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

  async function handleCreateConfirmed(): Promise<void> {
    if (products.length === 0) {
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      await createImportInvoiceDraft({
        products: products.map((product) => ({
          productId: product.productId,
          productSku: product.productSku,
          productName: product.productName,
          productUnit: product.productUnit,
          quantity: toNumberOrZero(product.quantity),
          importPrice: toNumberOrZero(product.importPrice),
          notes: product.notes || undefined,
        })),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      handleClose();
      onCreated?.();
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

    setConfirmAction("create");
  }

  const noteWarning = (noteTouched || createAttempted) && !notes.trim();
  const productError = createAttempted && products.length === 0;

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={() => setConfirmAction("cancel")}>
      <div className="flex h-[90vh] w-[92vw] max-w-[1200px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h1 className="text-sm font-semibold text-text">{dict.importDraft}</h1>
          <HeaderMeta label={dict.createdDate} value={nowText} />
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-5">
          {errorMessage && (
            <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiTile
              label={dict.totalImportPriceLabel}
              value={totals.totalImportPrice.toLocaleString()}
              icon={<DollarSign className="h-4 w-4 text-muted" />}
              accent={totals.totalImportPrice === 0 ? "warning" : "primary"}
              helpText={dict.totalImportPriceKpiHelp}
              sub={dict.totalImportPriceKpiSub}
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

          <ImportInvoiceProductsCard
            products={products}
            canEditDraft={true}
            accent={productError ? "danger" : "neutral"}
            onChangeProducts={setProducts}
          />

          <Field
            label={dict.noteLabel}
            warning={noteWarning ? dict.emptyDescription : undefined}
          >
            <Textarea
              value={notes}
              onChange={setNotes}
              onBlur={() => setNoteTouched(true)}
              placeholder={dict.descriptionPlaceholder}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button accent="neutral" onClick={() => setConfirmAction("cancel")}>
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
