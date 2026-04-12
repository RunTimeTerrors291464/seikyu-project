"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import { INVOICE_DRAFT_ERRORS } from "@/components/types/ui";
import Button from "@/components/ui/Buttons";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import { useReturnImportLinesEditor } from "@/features/invoices/hooks/useReturnImportLinesEditor";
import type { ImportInvoiceProductDto } from "@/features/invoices/services/importInvoice.service";
import { createReturnImportDraft } from "@/features/invoices/services/returnImportInvoice.service";
import { returnImportDraftProductColumns } from "@/features/invoices/table/invoiceProductLineColumns";
import { toNumberOrZero } from "@/features/invoices/types/importInvoiceDetail";
import {
  EditableReturnImportLine,
  toEditableReturnImportLine,
} from "@/features/invoices/types/returnImportDraft";
import { useDict } from "@/lib/lang/DictProvider";
import {
  formatPriceNumber,
  lineTotalFromQuantityAndMoneyStrings,
} from "@/lib/numeric/integerAndMoneyInputs";
import { AlertTriangle, Boxes, DollarSign, Package } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReturnImportProductsCard from "./ReturnImportProductsCard";

type CreateReturnImportInvoicePopupProps = {
  open: boolean;
  importInvoiceId: string;
  sourceProducts: ImportInvoiceProductDto[];
  onClose: () => void;
  onCreated?: (returnInvoiceId: string) => void;
};

type ConfirmAction = "cancel" | "create" | null;

export default function CreateReturnImportInvoicePopup({
  open,
  importInvoiceId,
  sourceProducts,
  onClose,
  onCreated,
}: CreateReturnImportInvoicePopupProps) {
  const dict = useDict();
  const [lines, setLines] = useState<EditableReturnImportLine[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [creating, setCreating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [createAttempted, setCreateAttempted] = useState<boolean>(false);
  const [returnAllConfirmOpen, setReturnAllConfirmOpen] =
    useState<boolean>(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] =
    useState<boolean>(false);
  const nowText = useMemo(() => new Date().toISOString(), [open]);
  const sourceProductsRef = useRef<ImportInvoiceProductDto[]>(sourceProducts);
  sourceProductsRef.current = sourceProducts;

  const previousHadPositiveReturnLineRef = useRef<boolean>(false);

  const { updateLine, handleBlurReturnQuantity } =
    useReturnImportLinesEditor<EditableReturnImportLine>(
      setLines,
      function getLineId(line: EditableReturnImportLine): string {
        return line.localId;
      },
    );

  const totals = useMemo(() => {
    let totalQuantity = 0;
    let totalReturnPrice = 0;

    lines.forEach((line) => {
      const qty = toNumberOrZero(line.returnQuantity);
      const lineTotal = lineTotalFromQuantityAndMoneyStrings(
        line.returnQuantity,
        line.importPrice,
      );

      totalQuantity += qty;
      totalReturnPrice += lineTotal;
    });

    return {
      totalProducts: lines.filter(
        (line) => toNumberOrZero(line.returnQuantity) > 0,
      ).length,
      totalQuantity,
      totalReturnPrice,
    };
  }, [lines]);

  const hasPositiveReturnLine = useMemo(
    () => lines.some((line) => toNumberOrZero(line.returnQuantity) > 0),
    [lines],
  );

  const hasMissingNotesForPositiveLines = useMemo(
    () =>
      lines.some(
        (line) =>
          toNumberOrZero(line.returnQuantity) > 0 &&
          line.notes.trim() === "",
      ),
    [lines],
  );

  const returnNeedsLineMessage =
    dict[INVOICE_DRAFT_ERRORS.returnAtLeastOneLine.key];
  const returnNeedsNoteMessage =
    dict[INVOICE_DRAFT_ERRORS.returnMissingNote.key];

  useEffect(
    function clearReturnValidationMessageWhenFixed(): void {
      if (!open) {
        return;
      }

      setErrorMessage(function clearIfValidationResolved(previous): string {
        if (previous === returnNeedsLineMessage && hasPositiveReturnLine) {
          return "";
        }

        if (
          previous === returnNeedsNoteMessage &&
          !hasMissingNotesForPositiveLines
        ) {
          return "";
        }

        return previous;
      });
    },
    [
      open,
      hasPositiveReturnLine,
      hasMissingNotesForPositiveLines,
      returnNeedsLineMessage,
      returnNeedsNoteMessage,
    ],
  );

  useEffect(
    function resetCreateAttemptWhenFirstReturnQuantityAdded(): void {
      if (!open) {
        return;
      }

      const previousPositive = previousHadPositiveReturnLineRef.current;
      previousHadPositiveReturnLineRef.current = hasPositiveReturnLine;

      if (!previousPositive && hasPositiveReturnLine) {
        setCreateAttempted(false);
      }
    },
    [open, hasPositiveReturnLine],
  );

  function resetState(): void {
    setNotes("");
    setConfirmAction(null);
    setReturnAllConfirmOpen(false);
    setClearAllConfirmOpen(false);
    setCreating(false);
    setErrorMessage("");
    setCreateAttempted(false);
  }

  useEffect(
    function syncWhenOpened(): void {
      if (!open) {
        return;
      }

      setLines(sourceProductsRef.current.map(toEditableReturnImportLine));
      setNotes("");
      setErrorMessage("");
      setCreateAttempted(false);
      setConfirmAction(null);
      setReturnAllConfirmOpen(false);
      setClearAllConfirmOpen(false);
    },
    [open, importInvoiceId],
  );

  function handleClose(): void {
    resetState();
    setLines([]);
    onClose();
  }

  function handleCancelConfirmed(): void {
    handleClose();
  }

  async function handleCreateConfirmed(): Promise<void> {
    const productsPayload = lines
      .filter((line) => toNumberOrZero(line.returnQuantity) > 0)
      .map((line) => ({
        productId: line.productId,
        returnQuantity: Math.floor(toNumberOrZero(line.returnQuantity)),
        notes: line.notes.trim() ? line.notes.trim() : undefined,
      }));

    if (productsPayload.length === 0) {
      setErrorMessage(returnNeedsLineMessage);
      return;
    }

    const payloadMissingNotes = productsPayload.some(
      (line) => !line.notes || line.notes.trim() === "",
    );

    if (payloadMissingNotes) {
      setErrorMessage(returnNeedsNoteMessage);
      return;
    }

    setCreating(true);
    setErrorMessage("");

    try {
      const response = await createReturnImportDraft({
        importInvoiceId,
        products: productsPayload,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      handleClose();
      onCreated?.(response.id);
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
    setErrorMessage("");

    if (!hasPositiveReturnLine) {
      setErrorMessage(returnNeedsLineMessage);
      return;
    }

    if (hasMissingNotesForPositiveLines) {
      setErrorMessage(returnNeedsNoteMessage);
      return;
    }

    setConfirmAction("create");
  }

  function handleReturnAll(): void {
    setLines((current) =>
      current.map((line) => {
        const maxQuantity =
          sourceProductsRef.current.find(
            (product) => product.productId === line.productId,
          )?.quantity ?? 0;

        if (maxQuantity <= 0) {
          return { ...line, returnQuantity: "0", notes: "" };
        }

        return {
          ...line,
          returnQuantity: String(Math.floor(maxQuantity)),
        };
      }),
    );
  }

  function handleClearAll(): void {
    setLines((current) =>
      current.map((line) => ({
        ...line,
        returnQuantity: "0",
        notes: "",
      })),
    );
  }

  function handleOpenClearAllConfirm(): void {
    setClearAllConfirmOpen(true);
  }

  function handleOpenReturnAllConfirm(): void {
    setReturnAllConfirmOpen(true);
  }

  function handleReturnAllConfirmed(): void {
    handleReturnAll();
    setReturnAllConfirmOpen(false);
  }

  function handleClearAllConfirmed(): void {
    handleClearAll();
    setClearAllConfirmOpen(false);
  }

  const columns = returnImportDraftProductColumns({
    dict,
    onUpdateLine: updateLine,
    onBlurReturnQuantity: handleBlurReturnQuantity,
    shouldShowReturnQuantityError: createAttempted && !hasPositiveReturnLine,
    showNoteErrorForLine: (line) => {
      if (!createAttempted) {
        return false;
      }

      const hasPositiveLine = toNumberOrZero(line.returnQuantity) > 0;
      // Only mark note as invalid once the user has entered a positive quantity.
      return hasPositiveLine && line.notes.trim() === "";
    },
  });

  const returnHeaderErrorAccent =
    errorMessage === returnNeedsLineMessage
      ? INVOICE_DRAFT_ERRORS.returnAtLeastOneLine.accent
      : errorMessage === returnNeedsNoteMessage
        ? INVOICE_DRAFT_ERRORS.returnMissingNote.accent
        : "danger";

  const returnProductsCardDangerAccent =
    createAttempted && !hasPositiveReturnLine;

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={() => setConfirmAction("cancel")}>
      <div className="flex h-[90vh] w-[92vw] max-w-[1200px] flex-col overflow-hidden bg-bg">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h1 className="shrink-0 text-sm font-semibold text-text">
            {dict.createReturnInvoiceTitle}
          </h1>
          <div className="flex min-w-0 flex-1 justify-center px-2">
            {errorMessage ? (
              <HeaderMeta
                icon={<AlertTriangle className="h-4 w-4" />}
                label={dict.error}
                value={errorMessage}
                accent={returnHeaderErrorAccent}
                format="text"
              />
            ) : null}
          </div>
          <div className="shrink-0">
            <HeaderMeta label={dict.createdDate} value={nowText} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiTile
              label={dict.totalReturnPriceLabel}
              value={formatPriceNumber(totals.totalReturnPrice)}
              icon={<DollarSign className="h-4 w-4 text-muted" />}
              accent={totals.totalReturnPrice === 0 ? "warning" : "primary"}
              helpText={dict.totalReturnPriceKpiHelp}
              sub={dict.totalReturnPriceKpiSub}
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

          <ReturnImportProductsCard<EditableReturnImportLine>
            lines={lines}
            columns={columns}
            canEditDraft
            getRowId={(row) => row.localId}
            onClearAll={handleOpenClearAllConfirm}
            onReturnAll={handleOpenReturnAllConfirm}
            resetKey={`${open}-${importInvoiceId}`}
            className="flex grow"
            accent={returnProductsCardDangerAccent ? "danger" : "neutral"}
          />

          <Field label={dict.noteLabel}>
            <Textarea
              value={notes}
              onChange={setNotes}
              placeholder={dict.invoiceDescriptionPlaceholder}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button accent="neutral" onClick={() => setConfirmAction("cancel")}>
            {dict.cancel}
          </Button>
          <Button accent="primary" onClick={handleOpenCreateConfirm}>
            {dict.createReturnDraft}
          </Button>
        </div>
      </div>

      <ConfirmPopup
        open={confirmAction === "cancel"}
        title={dict.confirmDiscardReturnDraftTitle}
        description={dict.confirmDiscardReturnDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={handleCancelConfirmed}
        onClose={() => setConfirmAction(null)}
        accent="danger"
      />

      <ConfirmPopup
        open={confirmAction === "create"}
        title={dict.confirmCreateReturnDraftTitle}
        description={dict.confirmCreateReturnDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={creating}
        onConfirm={handleCreateConfirmed}
        onClose={() => setConfirmAction(null)}
      />

      <ConfirmPopup
        open={returnAllConfirmOpen}
        title={dict.confirmReturnAllTitle}
        description={dict.confirmReturnAllDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={handleReturnAllConfirmed}
        onClose={() => setReturnAllConfirmOpen(false)}
        accent="danger"
      />

      <ConfirmPopup
        open={clearAllConfirmOpen}
        title={dict.confirmClearAllReturnsTitle}
        description={dict.confirmClearAllReturnsDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={handleClearAllConfirmed}
        onClose={() => setClearAllConfirmOpen(false)}
        accent="danger"
      />
    </Popup>
  );
}
