"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import AddProductForm from "@/features/products/form/addProductForm";
import { createProduct } from "@/features/products/services/product.service";
import type { CreateProductPayload, Product } from "@/features/products/types/product";
import { useDict } from "@/lib/lang/DictProvider";
import { useState } from "react";
import type { EditableImportInvoiceProduct } from "../types/importInvoiceDetail";

type CreateAndAddProductPopupProps = {
  open: boolean;
  onClose: () => void;
  onCreatedAndAdd: (product: EditableImportInvoiceProduct) => void;
};

type ConfirmAction = "cancel" | "create" | null;

type AddProductFormData = {
  sku: string;
  name: string;
  productUnitId: string;
  productDescription: string;
  importPrice: number;
  sellingPrice: number;
  reorderThreshold: number;
};

function toEditableImportInvoiceProduct(product: Product, productName: string): EditableImportInvoiceProduct {
  return {
    localId: `${product.id}-${Date.now()}`,
    productId: product.id,
    productSku: product.sku,
    productName: product.productNames?.[0] ?? productName,
    productUnit: product.productUnitName,
    quantity: "0",
    importPrice: String(product.importPrice),
    notes: "",
  };
}

export default function CreateAndAddProductPopup({
  open,
  onClose,
  onCreatedAndAdd,
}: CreateAndAddProductPopupProps) {
  const dict = useDict();
  const [formData, setFormData] = useState<AddProductFormData | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [loading, setLoading] = useState<boolean>(false);

  async function handleCreateAndAdd(): Promise<void> {
    if (!formData) {
      return;
    }

    const payload: CreateProductPayload = {
      sku: formData.sku,
      productNames: [formData.name],
      productUnitId: formData.productUnitId,
      productDescription: formData.productDescription,
      importPrice: formData.importPrice,
      sellingPrice: formData.sellingPrice,
      reorderThreshold: formData.reorderThreshold,
    };

    setLoading(true);
    try {
      const createdProduct = (await createProduct(payload)) as Product;
      onCreatedAndAdd(toEditableImportInvoiceProduct(createdProduct, formData.name));
      setConfirmAction(null);
      setFormData(null);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleRequestCreate(): void {
    const formElement = document.querySelector("form");
    formElement?.requestSubmit();
  }

  if (!open) {
    return null;
  }

  return (
    <Popup open={open} onClose={function requestCancel(): void {
      setConfirmAction("cancel");
    }}>
      <div className="flex w-[520px] max-w-[92vw] flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          {dict.createAndAddProduct}
        </div>

        <div className="max-h-[72vh] overflow-auto p-4">
          <AddProductForm
            dict={dict}
            onSubmit={function submitCreateForm(data): void {
              setFormData(data);
              setConfirmAction("create");
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button accent="neutral" onClick={function requestCancel(): void {
            setConfirmAction("cancel");
          }}>
            {dict.cancel}
          </Button>
          <Button accent="primary" onClick={handleRequestCreate}>
            {dict.create}
          </Button>
        </div>
      </div>

      <ConfirmPopup
        open={confirmAction === "cancel"}
        title={dict.confirmDiscardCreateAndAddProductTitle}
        description={dict.confirmDiscardCreateAndAddProductDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        accent="danger"
        onClose={function closeCancelConfirm(): void {
          setConfirmAction(null);
        }}
        onConfirm={function confirmCancel(): void {
          setConfirmAction(null);
          setFormData(null);
          onClose();
        }}
      />

      <ConfirmPopup
        open={confirmAction === "create"}
        title={dict.confirmCreateAndAddProductTitle}
        description={dict.confirmCreateAndAddProductDescription}
        confirmText={dict.confirm}
        cancelText={dict.cancel}
        loading={loading}
        onClose={function closeCreateConfirm(): void {
          setConfirmAction(null);
        }}
        onConfirm={handleCreateAndAdd}
      />
    </Popup>
  );
}
