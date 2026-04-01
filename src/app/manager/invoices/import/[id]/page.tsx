"use client";

import { ConfirmPopup } from "@/components/layout/Popup";
import { formatDate } from "@/components/types/ui";
import { Field, Textarea } from "@/components/ui/Fields";
import KpiTile from "@/components/ui/KpiTile";
import ImportInvoiceHeader from "@/features/import-invoices/layout/ImportInvoiceHeader";
import ImportInvoiceProductsCard from "@/features/import-invoices/layout/ImportInvoiceProductsCard";
import {
  ImportInvoiceResponseDto,
  confirmImportInvoice,
  deleteImportInvoiceDrafts,
  editImportInvoiceDraft,
  getImportInvoiceById,
} from "@/features/import-invoices/services/importInvoice.service";
import {
  EditableImportInvoiceProduct,
  toEditableProduct,
  toNumberOrZero,
} from "@/features/import-invoices/types/importInvoiceDetail";
import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { useDict } from "@/lib/lang/DictProvider";
import { Boxes, DollarSign, Package, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [saveConfirmOpen, setSaveConfirmOpen] = useState<boolean>(false);
  const [confirmDraftPopupOpen, setConfirmDraftPopupOpen] = useState<boolean>(false);
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

  function handleOpenSaveConfirm(): void {
    if (!isDirty || !canEditDraft) {
      return;
    }
    setSaveConfirmOpen(true);
  }

  function handleOpenConfirmDraftPopup(): void {
    if (!canEditDraft) {
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
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <ImportInvoiceHeader
        title={invoice.invoiceId ?? dict.draft}
        status={invoice.status}
        canEditDraft={canEditDraft}
        saving={saving}
        confirming={confirming}
        deleting={deleting}
        saveDisabled={!isDirty}
        onSave={handleOpenSaveConfirm}
        onConfirm={handleOpenConfirmDraftPopup}
        onDelete={handleDeleteDraft}
      />

      {errorMessage && (
        <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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

      <Field label={dict.noteLabel}>
        <Textarea
          value={notes}
          onChange={setNotes}
          disabled={!canEditDraft}
          placeholder={dict.descriptionPlaceholder}
        />
      </Field>

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
    </div>
  );
}
