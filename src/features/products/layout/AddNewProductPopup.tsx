"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";

import { useState } from "react";

import { Dictionary } from "@/lib/lang/i18n";
import AddProductForm from "../form/addProductForm";
import { createProduct } from "../services/product.service";
import type { CreateProductPayload } from "../types/product";

type Props = {
  open: boolean;
  onClose: () => void;
  dict: Dictionary;
  onCreated?: () => void;
};

export default function AddProductPopup({
  open,
  onClose,
  dict,
  onCreated,
}: Props) {

  type AddProductFormData = {
    sku: string;
    name: string;
    productUnitId: string;
    productDescription: string;
    importPrice: number;
    sellingPrice: number;
    reorderThreshold: number;
  };

  const [formData, setFormData] = useState<AddProductFormData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ============================= */
  /* CREATE */
  /* ============================= */

  async function handleCreate() {
    if (!formData) return;

    setLoading(true);

    try {
      const payload: CreateProductPayload = {
        sku: formData.sku,
        productNames: [formData.name],
        productUnitId: formData.productUnitId,
        productDescription: formData.productDescription,
        importPrice: formData.importPrice,
        sellingPrice: formData.sellingPrice,
        reorderThreshold: formData.reorderThreshold,
      };

      await createProduct(payload);

      onCreated?.();
      onClose();

    } catch (err) {
      console.error("Create product failed", err);
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  if (!open) return null;

  return (
    <Popup open={open} onClose={onClose}>
      <div className="flex flex-col w-[500px] max-w-[90vw] max-h-[90vh] bg-bg">

        {/* HEADER */}
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          {dict.addProduct}
        </div>

        {/* BODY */}
        <div className="p-4 overflow-auto">
          <AddProductForm
            dict={dict}
            onSubmit={(data) => {
              setFormData(data);
              setConfirmOpen(true);
            }}
          />
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button onClick={onClose} accent="neutral">
            {dict.cancel}
          </Button>

          <Button
            accent="primary"
            onClick={() => {
              const form = document.querySelector("form");
              form?.requestSubmit();
            }}
          >
            {dict.create}
          </Button>
        </div>

        {/* CONFIRM POPUP */}
        {confirmOpen && (
          <ConfirmPopup
            open={confirmOpen}
            title={dict.confirmCreateProductTitle}
            description={dict.confirmCreateProductDescription}
            confirmText={dict.confirm}
            cancelText={dict.cancel}
            loading={loading}
            onClose={() => setConfirmOpen(false)}
            onConfirm={handleCreate}
          />
        )}

      </div>
    </Popup>
  );
}