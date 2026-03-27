"use client";

import Popup from "@/components/layout/BlurPopupWraper";
import { ConfirmPopup } from "@/components/layout/Popup";
import Button from "@/components/ui/Buttons";
import { useState } from "react";

import { Dictionary } from "@/lib/lang/i18n";
import AddProductForm, { CreateProductFormData } from "../form/addProductForm";
import { createProduct } from "../services/product.service";

type Props = {
  open: boolean;
  onClose: () => void;
  dict: Dictionary;
  onCreated?: () => void;
};

export default function AddNewProductPopup({
  open,
  onClose,
  dict,
  onCreated,
}: Props) {

  const [formData, setFormData] = useState<CreateProductFormData | null>(null);
  const [valid, setValid] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!formData) return;

    setLoading(true);

    try {
      await createProduct({
        sku: formData.sku,
        productNames: [formData.name],
        productUnitId: formData.productUnitId,
        productDescription: formData.productDescription,
        importPrice: formData.importPrice,
        sellingPrice: formData.sellingPrice,
        reorderThreshold: formData.reorderThreshold,
      });

      onCreated?.();
      onClose();

    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  if (!open) return null;

  return (
    <Popup open={open} onClose={onClose}>
      <div className="flex flex-col w-[500px] max-w-[90vw] max-h-[90vh]">

        {/* HEADER */}
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          {dict.addProduct}
        </div>

        {/* BODY */}
        <div className="p-4 overflow-auto">
          <AddProductForm
            dict={dict}
            onChange={(data, isValid) => {
              setFormData(data);
              setValid(isValid);
            }}
          />
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button onClick={onClose} accent="neutral">
            {dict.cancel}
          </Button>

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!valid}
          >
            {dict.create}
          </Button>
        </div>

        {/* CONFIRM */}
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