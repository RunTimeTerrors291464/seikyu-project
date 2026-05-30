"use client";

import { ConfirmPopup, DeletePopup } from "@/components/layout/Popup";
import { formatDate } from "@/components/types/ui";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import { useStockAdjustmentInvoiceProductsEditor } from "@/features/invoices/hooks/useStockAdjustmentInvoiceProductsEditor";
import { STOCK_ADJUSTMENT_REASON_CATEGORY_OPTIONS } from "@/features/invoices/filters/stockAdjustmentInvoiceFilters";
import StockAdjustmentInvoiceHeader from "@/features/invoices/layout/StockAdjustmentInvoiceHeader";
import StockAdjustmentProductsCard from "@/features/invoices/layout/StockAdjustmentProductsCard";
import {
  type StockAdjustmentInvoiceResponseDto,
  type StockAdjustmentReasonCategory,
  confirmStockAdjustmentInvoice,
  deleteStockAdjustmentInvoiceDrafts,
  editStockAdjustmentInvoiceDraft,
  getStockAdjustmentInvoiceById,
} from "@/features/invoices/services/stockAdjustmentInvoice.service";
import {
  EditableStockAdjustmentLine,
  buildStockAdjustmentProductRequests,
  resolveStockAdjustmentReasonCategory,
  stockAdjustmentLineDtoToEditable,
  toNumberOrZero,
} from "@/features/invoices/types/stockAdjustmentDetail";
import { useDraftNavigationGuard } from "@/lib/hooks/useDraftNavigationGuard";
import { useMayUseManagerWorkflowControls } from "@/lib/hooks/useManagerWorkflowAccess";
import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { resolveApiErrorMessage } from "@/lib/api/errors";
import { useDict } from "@/lib/lang/DictProvider";
import { AlertTriangle, Boxes, Package, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StockAdjustmentInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dict = useDict();
  const invoiceId = params.id;
  const canManage = useMayUseManagerWorkflowControls();

  const [invoice, setInvoice] = useState<StockAdjustmentInvoiceResponseDto | null>(null);
  const [products, setProducts] = useState<EditableStockAdjustmentLine[]>([]);
  const [reasonCategory, setReasonCategory] =
    useState<StockAdjustmentReasonCategory>("damage");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [saveConfirmOpen, setSaveConfirmOpen] = useState<boolean>(false);
  const [confirmDraftPopupOpen, setConfirmDraftPopupOpen] = useState<boolean>(false);
  const [initialNotes, setInitialNotes] = useState<string>("");
  const [initialReasonCategory, setInitialReasonCategory] =
    useState<StockAdjustmentReasonCategory>("damage");
  const [initialProductsSignature, setInitialProductsSignature] = useState<string>("[]");

  function toProductsSignature(
    currentProducts: EditableStockAdjustmentLine[],
  ): string {
    return JSON.stringify(
      currentProducts.map((product) => ({
        productId: product.productId,
        productSku: product.productSku,
        productName: product.productName,
        productUnit: product.productUnit,
        action: product.action,
        quantity: toNumberOrZero(product.quantity),
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
        const response = await getStockAdjustmentInvoiceById(invoiceId);

        if (!isMounted) {
          return;
        }

        setInvoice(response);
        setProducts(response.products.map(stockAdjustmentLineDtoToEditable));
        const loadedReasonCategory = resolveStockAdjustmentReasonCategory(
          response.products,
        );
        setReasonCategory(loadedReasonCategory);
        setNotes(response.notes ?? "");
        setInitialNotes(response.notes ?? "");
        setInitialReasonCategory(loadedReasonCategory);
        setInitialProductsSignature(
          toProductsSignature(response.products.map(stockAdjustmentLineDtoToEditable)),
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
  }, [invoiceId, dict]);

  const canEditDraft = invoice?.status === "draft";
  const effectiveCanEditDraft = Boolean(canEditDraft && canManage);

  const {
    updateRow,
    totals,
    hasInvalidLines,
    draftError,
  } = useStockAdjustmentInvoiceProductsEditor({
    products,
    onChangeProducts: setProducts,
    validationActive: Boolean(effectiveCanEditDraft),
  });

  async function handleSaveDraft(): Promise<void> {
    if (!invoice || !effectiveCanEditDraft) {
      return;
    }

    if (hasInvalidLines || draftError) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      const response = await editStockAdjustmentInvoiceDraft({
        id: invoice.id,
        notes: notes.trim() ? notes.trim() : undefined,
        products: buildStockAdjustmentProductRequests(products, reasonCategory),
      });

      setInvoice(response);
      setProducts(response.products.map(stockAdjustmentLineDtoToEditable));
      const savedReasonCategory = resolveStockAdjustmentReasonCategory(
        response.products,
      );
      setReasonCategory(savedReasonCategory);
      setNotes(response.notes ?? "");
      setInitialNotes(response.notes ?? "");
      setInitialReasonCategory(savedReasonCategory);
      setInitialProductsSignature(
        toProductsSignature(response.products.map(stockAdjustmentLineDtoToEditable)),
      );
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
      const response = await confirmStockAdjustmentInvoice(invoice.id);
      setInvoice(response);
      setProducts(response.products.map(stockAdjustmentLineDtoToEditable));
      const confirmedReasonCategory = resolveStockAdjustmentReasonCategory(
        response.products,
      );
      setReasonCategory(confirmedReasonCategory);
      setNotes(response.notes ?? "");
      setInitialNotes(response.notes ?? "");
      setInitialReasonCategory(confirmedReasonCategory);
      setInitialProductsSignature(
        toProductsSignature(response.products.map(stockAdjustmentLineDtoToEditable)),
      );
    } catch (error) {
      setErrorMessage(
        resolveApiErrorMessage(error, dict),
      );
    } finally {
      setConfirming(false);
      setConfirmDraftPopupOpen(false);
    }
  }

  const isDirty = useIsDirty<{
    notes: string;
    reasonCategory: StockAdjustmentReasonCategory;
    productsSignature: string;
  }>()(
    {
      notes: initialNotes,
      reasonCategory: initialReasonCategory,
      productsSignature: initialProductsSignature,
    },
    {
      notes,
      reasonCategory,
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
    if (!isDirty || !effectiveCanEditDraft || hasInvalidLines || draftError) {
      return;
    }
    setSaveConfirmOpen(true);
  }

  function handleOpenConfirmDraftPopup(): void {
    if (!effectiveCanEditDraft) {
      return;
    }

    if (hasInvalidLines || draftError) {
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
      await deleteStockAdjustmentInvoiceDrafts([invoice.id]);
      router.push("/manager/invoices/stock-adjustment");
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

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-4">
      <StockAdjustmentInvoiceHeader
        title={invoice.invoiceId ?? dict.draft}
        status={invoice.status}
        canEditDraft={canEditDraft}
        allowManagerActions={canManage}
        saving={saving}
        confirming={confirming}
        deleting={deleting}
        saveDisabled={!isDirty || hasInvalidLines || Boolean(draftError)}
        confirmDisabled={hasInvalidLines || Boolean(draftError)}
        onSave={handleOpenSaveConfirm}
        onConfirm={handleOpenConfirmDraftPopup}
        onDelete={() => setDeleteConfirmOpen(true)}
        onBack={function handleBack(): void {
          requestNavigate("/manager/invoices/stock-adjustment");
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
          ) : null
        }
      />

      {errorMessage && (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-4">
        <KpiTile
          label={dict.totalProducts}
          value={totals.totalProducts.toLocaleString()}
          icon={<Package className="h-4 w-4 text-muted" />}
          accent="success"
          helpText={dict.totalProductsKpiHelp}
          sub={dict.totalProductsKpiSub}
        />
        <KpiTile
          label={dict.totalQuantity}
          value={totals.totalQuantity.toLocaleString()}
          icon={<Boxes className="h-4 w-4 text-muted" />}
          accent="success"
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

      <StockAdjustmentProductsCard
        products={products}
        canEditDraft={effectiveCanEditDraft}
        onChangeProducts={setProducts}
        updateRow={updateRow}
      />

      <div className="flex max-h-[30vh] min-h-0 shrink-0 flex-col gap-3 overflow-hidden lg:flex-row lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Field label={dict.actionReasonLabel}>
            <select
              value={reasonCategory}
              onChange={function handleReasonChange(event): void {
                setReasonCategory(
                  event.target.value as StockAdjustmentReasonCategory,
                );
              }}
              disabled={!effectiveCanEditDraft}
              className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-text outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {STOCK_ADJUSTMENT_REASON_CATEGORY_OPTIONS.map(function renderOption(option) {
                return (
                  <option key={option.value} value={option.value}>
                    {dict[option.dictKey] ?? option.value}
                  </option>
                );
              })}
            </select>
          </Field>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Field fillHeight label={dict.noteLabel}>
            <Textarea
              value={notes}
              onChange={setNotes}
              disabled={!effectiveCanEditDraft}
              placeholder={dict.invoiceDescriptionPlaceholder}
              rows={1}
              className="min-h-0 flex-1 overflow-y-auto"
            />
          </Field>
        </div>
      </div>

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
        title={dict.confirmConfirmStockAdjustmentDraftTitle}
        description={dict.confirmConfirmStockAdjustmentDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={confirming}
        onConfirm={handleConfirm}
        onClose={() => setConfirmDraftPopupOpen(false)}
      />

      <ConfirmPopup
        open={discardNavigateOpen}
        title={dict.confirmDiscardStockAdjustmentUnsavedTitle}
        description={dict.confirmDiscardStockAdjustmentUnsavedDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={confirmDiscardNavigate}
        onClose={closeDiscardNavigate}
        accent="danger"
      />

      <DeletePopup
        open={deleteConfirmOpen}
        title={dict.confirmDeleteStockAdjustmentDraftTitle}
        description={dict.confirmDeleteStockAdjustmentDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={deleting}
        onConfirm={handleDeleteDraft}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
