"use client";

import { ConfirmPopup, DeletePopup } from "@/components/layout/Popup";
import { INVOICE_DRAFT_ERRORS, formatDate } from "@/components/types/ui";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import { useReturnImportLinesEditor } from "@/features/invoices/hooks/useReturnImportLinesEditor";
import InvoicePrintPreviewPopup, {
  type InvoicePrintData,
} from "@/features/invoices/layout/InvoicePrintPreviewPopup";
import ReturnImportProductsCard from "@/features/invoices/layout/ReturnImportProductsCard";
import ReturnSellingInvoiceHeader from "@/features/invoices/layout/ReturnSellingInvoiceHeader";
import { buildReturnSellingProductRequest } from "@/features/invoices/lib/returnInvoiceReason";
import {
  confirmReturnSellingInvoice,
  deleteReturnSellingDrafts,
  editReturnSellingDraft,
  getReturnSellingInvoiceById,
  type ReturnSellingInvoiceResponseDto,
} from "@/features/invoices/services/returnSellingInvoice.service";
import { getSellingInvoiceById } from "@/features/invoices/services/sellingInvoice.service";
import { returnSellingInvoiceDetailProductColumns } from "@/features/invoices/table/sellingInvoiceProductLineColumns";
import { toNumberOrZero } from "@/features/invoices/types/importInvoiceDetail";
import {
  EditableReturnSellingDetailLine,
  toEditableReturnSellingDetailLine,
  toReturnSellingLinesSignature,
} from "@/features/invoices/types/returnSellingDetail";
import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDraftNavigationGuard } from "@/lib/hooks/useDraftNavigationGuard";
import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { useDict } from "@/lib/lang/DictProvider";
import {
  formatPriceNumber,
  lineTotalFromQuantityAndMoneyStrings,
} from "@/lib/numeric/integerAndMoneyInputs";
import { AlertTriangle, Boxes, DollarSign, Package, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ReturnSellingInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dict = useDict();
  const returnId = params.id;

  const [invoice, setInvoice] = useState<ReturnSellingInvoiceResponseDto | null>(
    null,
  );
  const [lines, setLines] = useState<EditableReturnSellingDetailLine[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [saveConfirmOpen, setSaveConfirmOpen] = useState<boolean>(false);
  const [confirmDraftPopupOpen, setConfirmDraftPopupOpen] =
    useState<boolean>(false);
  const [returnAllConfirmOpen, setReturnAllConfirmOpen] =
    useState<boolean>(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] =
    useState<boolean>(false);
  const [returnAllConfirming, setReturnAllConfirming] =
    useState<boolean>(false);
  const [initialNotes, setInitialNotes] = useState<string>("");
  const [initialLinesSignature, setInitialLinesSignature] =
    useState<string>("[]");
  const [draftValidationAttempted, setDraftValidationAttempted] =
    useState<boolean>(false);
  const [printPopupOpen, setPrintPopupOpen] = useState<boolean>(false);

  const { updateLine, handleBlurReturnQuantity } =
    useReturnImportLinesEditor<EditableReturnSellingDetailLine>(
      setLines,
      function getLineId(line: EditableReturnSellingDetailLine): string {
        return line.lineId;
      },
    );

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice(): Promise<void> {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getReturnSellingInvoiceById(returnId);

        if (!isMounted) {
          return;
        }

        setInvoice(response);
        setLines(response.products.map(toEditableReturnSellingDetailLine));
        setNotes(response.notes ?? "");
        setInitialNotes(response.notes ?? "");
        setInitialLinesSignature(
          toReturnSellingLinesSignature(
            response.products.map(toEditableReturnSellingDetailLine),
          ),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          resolveApiErrorMessage(error, dict),
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInvoice();

    return () => {
      isMounted = false;
    };
  }, [returnId, dict]);

  const canEditDraft = invoice?.status === "draft";

  const totals = useMemo(() => {
    let totalQuantity = 0;
    let totalReturnPrice = 0;

    lines.forEach((line) => {
      const qty = toNumberOrZero(line.returnQuantity);
      const lineTotal = lineTotalFromQuantityAndMoneyStrings(
        line.returnQuantity,
        line.sellingPrice,
      );
      totalQuantity += qty;
      totalReturnPrice += lineTotal;
    });

    return {
      totalProducts: lines.length,
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

  const columns = returnSellingInvoiceDetailProductColumns({
    dict,
    canEditDraft: Boolean(canEditDraft),
    onUpdateLine: updateLine,
    onBlurReturnQuantity: handleBlurReturnQuantity,
    shouldShowReturnQuantityError:
      draftValidationAttempted && !hasPositiveReturnLine,
    showNoteErrorForLine: function showNoteErrorForLine(
      line: EditableReturnSellingDetailLine,
    ): boolean {
      if (!draftValidationAttempted) {
        return false;
      }

      const hasPositiveLine = toNumberOrZero(line.returnQuantity) > 0;
      return hasPositiveLine && line.notes.trim() === "";
    },
  });

  async function handleSaveDraft(): Promise<void> {
    if (!invoice || !canEditDraft) {
      return;
    }

    setDraftValidationAttempted(true);

    if (!hasPositiveReturnLine || hasMissingNotesForPositiveLines) {
      setSaveConfirmOpen(false);
      return;
    }

    const productsPayload = lines
      .filter((line) => toNumberOrZero(line.returnQuantity) > 0)
      .map((line) =>
        buildReturnSellingProductRequest(
          line.productId,
          Math.floor(toNumberOrZero(line.returnQuantity)),
          line.notes,
        ),
      );

    setSaving(true);
    setErrorMessage("");

    try {
      const response = await editReturnSellingDraft({
        id: invoice.id,
        products: productsPayload,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      setInvoice(response);
      setLines(response.products.map(toEditableReturnSellingDetailLine));
      setNotes(response.notes ?? "");
      setInitialNotes(response.notes ?? "");
      setInitialLinesSignature(
        toReturnSellingLinesSignature(
          response.products.map(toEditableReturnSellingDetailLine),
        ),
      );
      setSaveConfirmOpen(false);
      setDraftValidationAttempted(false);
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!invoice || !canEditDraft) {
      return;
    }

    setDraftValidationAttempted(true);

    if (!hasPositiveReturnLine || hasMissingNotesForPositiveLines) {
      setConfirmDraftPopupOpen(false);
      return;
    }

    setConfirming(true);
    setErrorMessage("");

    try {
      const response = await confirmReturnSellingInvoice(invoice.id);
      setInvoice(response);
      setLines(response.products.map(toEditableReturnSellingDetailLine));
      setNotes(response.notes ?? "");
      setInitialNotes(response.notes ?? "");
      setInitialLinesSignature(
        toReturnSellingLinesSignature(
          response.products.map(toEditableReturnSellingDetailLine),
        ),
      );
      setDraftValidationAttempted(false);
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setConfirming(false);
      setConfirmDraftPopupOpen(false);
    }
  }

  const isDirty = useIsDirty<{ notes: string; linesSignature: string }>()(
    {
      notes: initialNotes,
      linesSignature: initialLinesSignature,
    },
    {
      notes,
      linesSignature: toReturnSellingLinesSignature(lines),
    },
  );

  const {
    requestNavigate,
    discardNavigateOpen,
    confirmDiscardNavigate,
    closeDiscardNavigate,
  } = useDraftNavigationGuard(Boolean(canEditDraft), isDirty);

  function handleOpenSaveConfirm(): void {
    if (!isDirty || !canEditDraft) {
      return;
    }

    setDraftValidationAttempted(true);

    if (!hasPositiveReturnLine) {
      return;
    }

    if (hasMissingNotesForPositiveLines) {
      return;
    }

    setSaveConfirmOpen(true);
  }

  function handleOpenConfirmDraftPopup(): void {
    if (!canEditDraft) {
      return;
    }

    setDraftValidationAttempted(true);

    if (!hasPositiveReturnLine) {
      return;
    }

    if (hasMissingNotesForPositiveLines) {
      return;
    }

    setConfirmDraftPopupOpen(true);
  }

  async function handleDeleteDraft(): Promise<void> {
    if (!invoice || !canEditDraft) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      await deleteReturnSellingDrafts([invoice.id]);
      router.push(`/manager/invoices/selling/${invoice.sellingInvoiceId}`);
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }

  function handleOpenReturnAllConfirm(): void {
    if (!canEditDraft) {
      return;
    }

    setReturnAllConfirmOpen(true);
  }

  function handleOpenClearAllConfirm(): void {
    if (!canEditDraft) {
      return;
    }

    setClearAllConfirmOpen(true);
  }

  async function handleReturnAllConfirmed(): Promise<void> {
    if (!invoice || !canEditDraft) {
      return;
    }

    setReturnAllConfirming(true);
    setErrorMessage("");

    try {
      const sourceSellingInvoice = await getSellingInvoiceById(
        invoice.sellingInvoiceId,
      );

      const maxQuantityByProductId = new Map<string, number>();

      sourceSellingInvoice.products.forEach((product) => {
        maxQuantityByProductId.set(product.productId, product.quantity);
      });

      setLines((current) =>
        current.map((line) => {
          const maxQuantity =
            maxQuantityByProductId.get(line.productId) ?? 0;

          if (maxQuantity <= 0) {
            return {
              ...line,
              returnQuantity: "0",
              notes: "",
            };
          }

          return {
            ...line,
            returnQuantity: String(Math.floor(maxQuantity)),
          };
        }),
      );
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setReturnAllConfirming(false);
      setReturnAllConfirmOpen(false);
    }
  }

  function handleClearAllConfirmed(): void {
    setLines((current) =>
      current.map((line) => ({
        ...line,
        returnQuantity: "0",
        notes: "",
      })),
    );

    setClearAllConfirmOpen(false);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        {dict.loading}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-danger">
        {errorMessage || dict.notFound}
      </div>
    );
  }

  const printData: InvoicePrintData = {
    invoiceCode: invoice.returnInvoiceId ?? dict.noInvoiceNo,
    status: invoice.status,
    createdBy: invoice.draftByUsername,
    createdAt: invoice.createdAt,
    confirmedBy: invoice.confirmedByUsername,
    confirmedAt: invoice.confirmedAt,
    notes,
    totalProducts: totals.totalProducts,
    totalQuantity: totals.totalQuantity,
    totalAmount: Number(totals.totalReturnPrice),
    showLineNotes: true,
    lines: lines.map(function toPrintLine(line) {
      const quantity = toNumberOrZero(line.returnQuantity);
      const unitPrice = toNumberOrZero(line.sellingPrice);
      return {
        sku: line.productSku,
        name: line.productName,
        unit: line.productUnit,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
        notes: line.notes,
      };
    }),
  };

  const draftError =
    canEditDraft && draftValidationAttempted && !hasPositiveReturnLine
      ? INVOICE_DRAFT_ERRORS.returnAtLeastOneLine
      : canEditDraft && draftValidationAttempted && hasMissingNotesForPositiveLines
        ? INVOICE_DRAFT_ERRORS.returnMissingNote
        : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4 ">
      <ReturnSellingInvoiceHeader
        title={invoice.returnInvoiceId ?? dict.draft}
        status={invoice.status}
        sourceSellingInvoiceId={invoice.sellingInvoiceId}
        canEditDraft={canEditDraft}
        saving={saving}
        confirming={confirming}
        deleting={deleting}
        saveDisabled={!isDirty}
        onSave={handleOpenSaveConfirm}
        onConfirm={handleOpenConfirmDraftPopup}
        onDelete={() => setDeleteConfirmOpen(true)}
        canPrint={invoice.status !== "draft"}
        onPrint={function handleOpenPrintPopup(): void {
          setPrintPopupOpen(true);
        }}
        onBack={function handleBack(): void {
          requestNavigate(
            `/manager/invoices/selling/${invoice.sellingInvoiceId}`,
          );
        }}
        middle={
          draftError ? (
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
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiTile
          label={dict.totalReturnPriceLabel}
          value={formatPriceNumber(totals.totalReturnPrice)}
          icon={<DollarSign className="h-4 w-4 text-muted" />}
          accent="danger"
          helpText={dict.totalReturnPriceKpiHelp}
          sub={dict.totalReturnPriceKpiSub}
        />
        <KpiTile
          label={dict.totalProducts}
          value={totals.totalProducts.toLocaleString()}
          icon={<Package className="h-4 w-4 text-muted" />}
          helpText={dict.totalProductsKpiHelp}
          sub={dict.totalProductsKpiSub}
        />
        <KpiTile
          label={dict.totalQuantity}
          value={totals.totalQuantity.toLocaleString()}
          icon={<Boxes className="h-4 w-4 text-muted" />}
          helpText={dict.totalQuantityKpiHelp}
          sub={dict.totalQuantityKpiSub}
        />
        <KpiTile
          label={dict.draftBy}
          value={invoice.draftByUsername ?? "—"}
          sub={invoice.draftAt ? formatDate(invoice.draftAt) : "—"}
          icon={<User className="h-4 w-4 text-muted" />}
          helpText={dict.draftByKpiHelp}
        />
        <KpiTile
          label={dict.confirmedBy}
          value={invoice.confirmedByUsername ?? dict.notConfirmed}
          sub={invoice.confirmedAt ? formatDate(invoice.confirmedAt) : "—"}
          icon={<User className="h-4 w-4 text-muted" />}
          helpText={dict.confirmedByKpiHelp}
        />
      </div>

      <ReturnImportProductsCard<EditableReturnSellingDetailLine>
        lines={lines}
        columns={columns}
        canEditDraft={canEditDraft}
        getRowId={(row) => row.lineId}
        onClearAll={handleOpenClearAllConfirm}
        onReturnAll={handleOpenReturnAllConfirm}
        resetKey={invoice.id}
        className="flex-1"
      />

      <Field label={dict.noteLabel}>
        <Textarea
          value={notes}
          onChange={setNotes}
          disabled={!canEditDraft}
          placeholder={dict.invoiceDescriptionPlaceholder}
        />
      </Field>

      <ConfirmPopup
        open={saveConfirmOpen}
        title={dict.confirmSaveReturnDraftTitle}
        description={dict.confirmSaveReturnDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={saving}
        onConfirm={handleSaveDraft}
        onClose={() => setSaveConfirmOpen(false)}
      />

      <ConfirmPopup
        open={confirmDraftPopupOpen}
        title={dict.confirmConfirmReturnDraftTitle}
        description={dict.confirmConfirmReturnDraftDescription}
        warning={isDirty ? dict.confirmDiscardReturnDraftDescription : undefined}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={confirming}
        onConfirm={handleConfirm}
        onClose={() => setConfirmDraftPopupOpen(false)}
      />

      <DeletePopup
        open={deleteConfirmOpen}
        title={dict.confirmDeleteReturnDraftTitle}
        description={dict.confirmDeleteReturnDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={deleting}
        onConfirm={handleDeleteDraft}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmPopup
        open={returnAllConfirmOpen}
        title={dict.confirmReturnAllTitle}
        description={dict.confirmReturnAllDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={returnAllConfirming}
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

      <ConfirmPopup
        open={discardNavigateOpen}
        title={dict.confirmDiscardUnsavedTitle}
        description={dict.confirmDiscardUnsavedDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={confirmDiscardNavigate}
        onClose={closeDiscardNavigate}
        accent="danger"
      />

      <InvoicePrintPreviewPopup
        open={printPopupOpen}
        data={printData}
        onClose={function handleClosePrintPopup(): void {
          setPrintPopupOpen(false);
        }}
        compactTable={true}
      />
    </div>
  );
}
