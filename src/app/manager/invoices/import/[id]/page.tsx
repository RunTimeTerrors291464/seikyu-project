"use client";

import { ConfirmPopup, DeletePopup } from "@/components/layout/Popup";
import { formatDate } from "@/components/types/ui";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import { useImportInvoiceProductsEditor } from "@/features/invoices/hooks/useImportInvoiceProductsEditor";
import CreateReturnImportInvoicePopup from "@/features/invoices/layout/CreateReturnImportInvoicePopup";
import ImportInvoiceDraftWorkspace from "@/features/invoices/layout/ImportInvoiceDraftWorkspace";
import ImportInvoiceHeader from "@/features/invoices/layout/ImportInvoiceHeader";
import ImportInvoiceProductsCard from "@/features/invoices/layout/ImportInvoiceProductsCard";
import ImportInvoiceReturnInvoicesCard from "@/features/invoices/layout/ImportInvoiceReturnInvoicesCard";
import InvoicePrintPreviewPopup, {
  type InvoicePrintData,
} from "@/features/invoices/layout/InvoicePrintPreviewPopup";
import {
  ImportInvoiceResponseDto,
  confirmImportInvoice,
  deleteImportInvoiceDrafts,
  editImportInvoiceDraft,
  getImportInvoiceById,
} from "@/features/invoices/services/importInvoice.service";
import {
  EditableImportInvoiceProduct,
  importCreateLinesToRequest,
  importLineDtoToEditable,
  toNumberOrZero,
} from "@/features/invoices/types/importInvoiceDetail";
import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDraftNavigationGuard } from "@/lib/hooks/useDraftNavigationGuard";
import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { useMayUseManagerWorkflowControls } from "@/lib/hooks/useManagerWorkflowAccess";
import { useDict } from "@/lib/lang/DictProvider";
import { formatPriceNumber } from "@/lib/numeric/integerAndMoneyInputs";
import { AlertTriangle, Boxes, DollarSign, Package, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ImportInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dict = useDict();
  const invoiceId = params.id;
  const canManage = useMayUseManagerWorkflowControls();

  const [invoice, setInvoice] = useState<ImportInvoiceResponseDto | null>(null);
  const [products, setProducts] = useState<EditableImportInvoiceProduct[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [saveConfirmOpen, setSaveConfirmOpen] = useState<boolean>(false);
  const [confirmDraftPopupOpen, setConfirmDraftPopupOpen] = useState<boolean>(false);
  const [returnPopupOpen, setReturnPopupOpen] = useState<boolean>(false);
  const [printPopupOpen, setPrintPopupOpen] = useState<boolean>(false);
  const [initialNotes, setInitialNotes] = useState<string>("");
  const [initialProductsSignature, setInitialProductsSignature] = useState<string>("[]");

  function toProductsSignature(currentProducts: EditableImportInvoiceProduct[]): string {
    return JSON.stringify(
      currentProducts.map((product) => ({
        productId: product.productId,
        productSku: product.productSku,
        productName: product.productName,
        productUnit: product.productUnit,
        quantity: toNumberOrZero(product.quantity),
        importPrice: toNumberOrZero(product.importPrice),
        notes: (product.notes || "").trim(),
      })),
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice(): Promise<void> {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await getImportInvoiceById(invoiceId);

        if (!isMounted) {
          return;
        }

        setInvoice(response);
        setProducts(response.products.map(importLineDtoToEditable));
        setNotes(response.notes ?? "");
        setInitialNotes(response.notes ?? "");
        setInitialProductsSignature(toProductsSignature(response.products.map(importLineDtoToEditable)));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(resolveApiErrorMessage(error, dict));
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
  }, [invoiceId, dict.somethingWentWrong]);

  const canEditDraft = invoice?.status === "draft";
  const canReturn =
    invoice?.status === "confirmed" || invoice?.status === "partiallyReturned";
  const effectiveCanEditDraft = Boolean(canEditDraft && canManage);

  const {
    updateRow,
    totals,
    hasEmptyQuantityOrImportPrice,
    draftError,
  } = useImportInvoiceProductsEditor(
    products,
    setProducts,
    Boolean(effectiveCanEditDraft),
  );

  async function handleSaveDraft(): Promise<void> {
    if (!invoice || !effectiveCanEditDraft) {
      return;
    }

    if (hasEmptyQuantityOrImportPrice) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const response = await editImportInvoiceDraft({
        id: invoice.id,
        notes,
        products: importCreateLinesToRequest(products),
      });

      setInvoice(response);
      setProducts(response.products.map(importLineDtoToEditable));
      setNotes(response.notes ?? "");
      setInitialNotes(response.notes ?? "");
      setInitialProductsSignature(toProductsSignature(response.products.map(importLineDtoToEditable)));
      setSaveConfirmOpen(false);
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!invoice || !effectiveCanEditDraft) {
      return;
    }

    setConfirming(true);
    setErrorMessage("");

    try {
      const response = await confirmImportInvoice(invoice.id);
      setInvoice(response);
      setProducts(response.products.map(importLineDtoToEditable));
      setNotes(response.notes ?? "");
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setConfirming(false);
      setConfirmDraftPopupOpen(false);
    }
  }

  const isDirty = useIsDirty<{ notes: string; productsSignature: string }>()(
    {
      notes: initialNotes,
      productsSignature: initialProductsSignature,
    },
    {
      notes,
      productsSignature: toProductsSignature(products),
    },
  );

  const {
    requestNavigate,
    discardNavigateOpen,
    confirmDiscardNavigate,
    closeDiscardNavigate,
  } = useDraftNavigationGuard(Boolean(effectiveCanEditDraft), isDirty);

  function handleOpenSaveConfirm(): void {
    if (!isDirty || !effectiveCanEditDraft || hasEmptyQuantityOrImportPrice) {
      return;
    }
    setSaveConfirmOpen(true);
  }

  function handleOpenConfirmDraftPopup(): void {
    if (!canEditDraft) {
      return;
    }

    if (hasEmptyQuantityOrImportPrice) {
      return;
    }
    setConfirmDraftPopupOpen(true);
  }

  async function handleDeleteDraft(): Promise<void> {
    if (!invoice || !effectiveCanEditDraft) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      await deleteImportInvoiceDrafts([invoice.id]);
      router.push("/manager/invoices/import");
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
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
    invoiceCode: invoice.invoiceId ?? dict.noInvoiceNo,
    status: invoice.status,
    createdBy: invoice.draftByUsername,
    createdAt: invoice.createdAt,
    confirmedBy: invoice.confirmedByUsername,
    confirmedAt: invoice.confirmedAt,
    notes,
    totalProducts: totals.totalProducts,
    totalQuantity: totals.totalQuantity,
    totalAmount: totals.totalImportPrice,
    lines: products.map(function toPrintLine(product) {
      const quantity = toNumberOrZero(product.quantity);
      const importPrice = toNumberOrZero(product.importPrice);
      return {
        sku: product.productSku,
        name: product.productName,
        unit: product.productUnit,
        quantity,
        lineTotal: quantity * importPrice,
        notes: product.notes,
      };
    }),
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4">
      <ImportInvoiceHeader
        title={invoice.invoiceId ?? dict.draft}
        status={invoice.status}
        canEditDraft={canEditDraft}
        allowManagerActions={canManage}
        canReturn={canReturn}
        saving={saving}
        confirming={confirming}
        deleting={deleting}
        saveDisabled={!isDirty || hasEmptyQuantityOrImportPrice}
        confirmDisabled={hasEmptyQuantityOrImportPrice}
        onSave={handleOpenSaveConfirm}
        onConfirm={handleOpenConfirmDraftPopup}
        onDelete={() => setDeleteConfirmOpen(true)}
        onReturn={() => setReturnPopupOpen(true)}
        canPrint={invoice.status !== "draft"}
        onPrint={function handleOpenPrintPopup(): void {
          setPrintPopupOpen(true);
        }}
        onBack={function handleBack(): void {
          requestNavigate("/manager/invoices/import");
        }}
        middle={
          draftError ? (
            <HeaderMeta
              icon={<AlertTriangle className="h-4 w-4"/>}
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

      {!effectiveCanEditDraft ? (
        <div className="grid gap-4 xl:grid-cols-5">
          <KpiTile
            label={dict.totalImportPriceLabel}
            value={formatPriceNumber(totals.totalImportPrice)}
            icon={<DollarSign className="h-4 w-4 text-muted" />}
            accent="success"
            helpText={dict.totalImportPriceKpiHelp}
            sub={dict.totalImportPriceKpiSub}
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
      ) : null}

      {effectiveCanEditDraft ? (
        <ImportInvoiceDraftWorkspace
          products={products}
          onChangeProducts={setProducts}
          notes={notes}
          onNotesChange={setNotes}
          updateRow={updateRow}
          totals={totals}
          lineFieldValidationActive={true}
        />
      ) : (
        <>
          <ImportInvoiceProductsCard
            products={products}
            canEditDraft={false}
            readOnlyTable={true}
            onChangeProducts={setProducts}
            updateRow={updateRow}
          />

          <div className="flex max-h-[30vh] min-h-0 shrink-0 flex-col gap-3 overflow-hidden lg:flex-row lg:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-[2] flex-col">
              <ImportInvoiceReturnInvoicesCard importInvoiceNo={invoice.invoiceId} />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Field fillHeight label={dict.noteLabel}>
                <Textarea
                  value={notes}
                  onChange={setNotes}
                  disabled={true}
                  placeholder={dict.invoiceDescriptionPlaceholder}
                  rows={1}
                  className="min-h-0 flex-1 overflow-y-auto"
                />
              </Field>
            </div>
          </div>
        </>
      )}

      <ConfirmPopup
        open={saveConfirmOpen}
        title={dict.confirmSaveTitle}
        description={dict.confirmSaveDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={saving}
        onConfirm={handleSaveDraft}
        onClose={() => setSaveConfirmOpen(false)}
      />

      <ConfirmPopup
        open={confirmDraftPopupOpen}
        title={dict.confirmConfirmImportDraftTitle}
        description={dict.confirmConfirmImportDraftDescription}
        warning={isDirty ? dict.confirmDiscardUnsavedDescription : undefined}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={confirming}
        onConfirm={handleConfirm}
        onClose={() => setConfirmDraftPopupOpen(false)}
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

      <DeletePopup
        open={deleteConfirmOpen}
        title={dict.confirmDeleteImportDraftTitle}
        description={dict.confirmDeleteImportDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={deleting}
        onConfirm={handleDeleteDraft}
        onClose={() => setDeleteConfirmOpen(false)}
      />

      <CreateReturnImportInvoicePopup
        open={returnPopupOpen}
        importInvoiceId={invoice.id}
        sourceProducts={invoice.products}
        onClose={() => setReturnPopupOpen(false)}
        onCreated={(newReturnId) => {
          setReturnPopupOpen(false);
          router.push(`/manager/invoices/return-invoice/${newReturnId}`);
        }}
      />

      <InvoicePrintPreviewPopup
        open={printPopupOpen}
        data={printData}
        onClose={function handleClosePrintPopup(): void {
          setPrintPopupOpen(false);
        }}
      />
    </div>
  );
}
