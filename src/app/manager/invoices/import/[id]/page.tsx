"use client";

import { ConfirmPopup, DeletePopup } from "@/components/layout/Popup";
import { INVOICE_DRAFT_ERRORS, formatDate } from "@/components/types/ui";
import { Field, Textarea } from "@/components/ui/Fields";
import { HeaderMeta } from "@/components/ui/HeaderMeta";
import KpiTile from "@/components/ui/KpiTile";
import CreateReturnImportInvoicePopup from "@/features/invoices/layout/CreateReturnImportInvoicePopup";
import ImportInvoiceHeader from "@/features/invoices/layout/ImportInvoiceHeader";
import ImportInvoiceProductsCard from "@/features/invoices/layout/ImportInvoiceProductsCard";
import ImportInvoiceReturnInvoicesCard from "@/features/invoices/layout/ImportInvoiceReturnInvoicesCard";
import {
  ImportInvoiceResponseDto,
  confirmImportInvoice,
  deleteImportInvoiceDrafts,
  editImportInvoiceDraft,
  getImportInvoiceById,
} from "@/features/invoices/services/importInvoice.service";
import {
  EditableImportInvoiceProduct,
  toEditableProduct,
  toNumberOrZero,
} from "@/features/invoices/types/importInvoiceDetail";
import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { useDict } from "@/lib/lang/DictProvider";
import { AlertTriangle, Boxes, DollarSign, Package, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ImportInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dict = useDict();
  const invoiceId = params.id;

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
  const [discardNavigateOpen, setDiscardNavigateOpen] = useState<boolean>(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [returnPopupOpen, setReturnPopupOpen] = useState<boolean>(false);
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
        setProducts(response.products.map(toEditableProduct));
        setNotes(response.notes ?? "");
        setInitialNotes(response.notes ?? "");
        setInitialProductsSignature(toProductsSignature(response.products.map(toEditableProduct)));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : dict.somethingWentWrong,
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
  }, [invoiceId, dict.somethingWentWrong]);

  const canEditDraft = invoice?.status === "draft";
  const canReturn =
    invoice?.status === "confirmed" || invoice?.status === "partiallyReturned";

  const hasEmptyQuantityOrImportPrice = useMemo(() => {
    return products.some(
      (product) =>
        toNumberOrZero(product.quantity) <= 0 ||
        product.importPrice.trim().length === 0,
    );
  }, [products]);

  const draftError = useMemo(() => {
    if (!canEditDraft) {
      return null;
    }

    const hasInvalidQuantity = products.some(
      (product) => toNumberOrZero(product.quantity) <= 0,
    );
    if (hasInvalidQuantity) {
      return INVOICE_DRAFT_ERRORS.importMissingQuantity;
    }

    const hasEmptyPrice = products.some(
      (product) => product.importPrice.trim().length === 0,
    );
    if (hasEmptyPrice) {
      return INVOICE_DRAFT_ERRORS.importMissingPrice;
    }

    return null;
  }, [canEditDraft, products]);

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

  async function handleSaveDraft(): Promise<void> {
    if (!invoice || !canEditDraft) {
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
        products: products.map((product) => ({
          productId: product.productId,
          productSku: product.productSku,
          productName: product.productName,
          productUnit: product.productUnit,
          quantity: toNumberOrZero(product.quantity),
          importPrice: toNumberOrZero(product.importPrice),
          notes: product.notes || undefined,
        })),
      });

      setInvoice(response);
      setProducts(response.products.map(toEditableProduct));
      setNotes(response.notes ?? "");
      setInitialNotes(response.notes ?? "");
      setInitialProductsSignature(toProductsSignature(response.products.map(toEditableProduct)));
      setSaveConfirmOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : dict.somethingWentWrong,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!invoice || !canEditDraft) {
      return;
    }

    setConfirming(true);
    setErrorMessage("");

    try {
      const response = await confirmImportInvoice(invoice.id);
      setInvoice(response);
      setProducts(response.products.map(toEditableProduct));
      setNotes(response.notes ?? "");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : dict.somethingWentWrong,
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

  const allowNavigationRef = useRef<boolean>(false);
  const currentHrefRef = useRef<string>("");
  const historyTrapInsertedRef = useRef<boolean>(false);

  function requestNavigate(href: string): void {
    if (!canEditDraft || !isDirty) {
      router.push(href);
      return;
    }

    setPendingHref(href);
    setDiscardNavigateOpen(true);
  }

  useEffect(function installNavigationGuards(): (() => void) | void {
    if (!canEditDraft || !isDirty) {
      return;
    }

    currentHrefRef.current = window.location.href;
    allowNavigationRef.current = false;

    if (!historyTrapInsertedRef.current) {
      window.history.pushState({ __discardNavigateGuard: true }, "", window.location.href);
      historyTrapInsertedRef.current = true;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      if (!canEditDraft || !isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    function handlePopState(): void {
      if (allowNavigationRef.current) {
        return;
      }
      if (!canEditDraft || !isDirty) {
        return;
      }

      const nextHref = window.location.href;
      setPendingHref(nextHref);
      setDiscardNavigateOpen(true);

      // Revert the URL so the user stays on this page until they confirm.
      window.history.pushState(
        { __discardNavigateGuard: true },
        "",
        currentHrefRef.current,
      );
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      historyTrapInsertedRef.current = false;
    };
  }, [canEditDraft, isDirty]);

  function handleOpenSaveConfirm(): void {
    if (!isDirty || !canEditDraft || hasEmptyQuantityOrImportPrice) {
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
    if (!invoice || !canEditDraft) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    try {
      await deleteImportInvoiceDrafts([invoice.id]);
      router.push("/manager/invoices/import");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : dict.somethingWentWrong,
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
      <ImportInvoiceHeader
        title={invoice.invoiceId ?? dict.draft}
        status={invoice.status}
        canEditDraft={canEditDraft}
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
          ) : null
        }
      />

      {errorMessage && (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-5">
        <KpiTile
          label={dict.totalImportPriceLabel}
          value={totals.totalImportPrice.toLocaleString()}
          icon={<DollarSign className="h-4 w-4 text-muted" />}
          accent="primary"
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

      <ImportInvoiceProductsCard
        products={products}
        canEditDraft={canEditDraft}
        onChangeProducts={setProducts}
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
              disabled={!canEditDraft}
              placeholder={dict.descriptionPlaceholder}
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
        title={dict.confirmConfirmImportDraftTitle}
        description={dict.confirmConfirmImportDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={confirming}
        onConfirm={handleConfirm}
        onClose={() => setConfirmDraftPopupOpen(false)}
      />

      <ConfirmPopup
        open={discardNavigateOpen}
        title={dict.confirmDiscardImportDraftTitle}
        description={dict.confirmDiscardImportDraftDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        onConfirm={function confirmDiscardNavigate(): void {
          if (!pendingHref) {
            setDiscardNavigateOpen(false);
            return;
          }

          const nextHref = pendingHref;
          setDiscardNavigateOpen(false);
          setPendingHref(null);
          allowNavigationRef.current = true;
          historyTrapInsertedRef.current = false;
          router.push(nextHref);
        }}
        onClose={function closeDiscardNavigate(): void {
          setDiscardNavigateOpen(false);
          setPendingHref(null);
        }}
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
    </div>
  );
}
