"use client";

import { ConfirmPopup } from "@/components/layout/Popup";
import ProductDetailsCard from "@/features/products/components/ProductDetailsCard";
import ProductHeader from "@/features/products/components/ProductHeader";
import ProductHistoryCard from "@/features/products/components/ProductHistoryCard";
import ProductNamesCard from "@/features/products/components/ProductNamesCard";
import { useProductDetail } from "@/features/products/hooks/useProductDetails";
import { useDict } from "@/lib/lang/DictProvider";
import { CircleOff, PowerCircle } from "lucide-react";
import { useParams } from "next/navigation";

export default function Page() {
  const { id } = useParams();

  const {
    product,
    loading,
    update,

    requestToggleActive,
    confirmToggleActive,
    cancelToggleActive,
    showActivePopup,

    isInactive,
    saveProduct,
    isDirty,
  } = useProductDetail(id as string);

  const dict = useDict();

  console.log("[ProductPage] render", {
    productId: id,
    isDirty,
    loading,
  });

  if (loading || !product) return null;
  return (
    <div className="space-y-6 grow">
      {/* HEADER */}
      <ProductHeader
        name={product.productNames[0]}
        createdAt={product.createdAt}
        updatedAt={product.updatedAt}
        active={product.isActive}
        onToggleActive={requestToggleActive}
        onSave={saveProduct}
        canSave={isDirty}
      />
      <ConfirmPopup
        open={showActivePopup}
        title={
          product.isActive
            ? dict.confirmDeactivateTitle
            : dict.confirmActivateTitle
        }
        description={
          product.isActive
            ? dict.confirmDeactivateDescription
            : dict.confirmActivateDescription
        }
        confirmText={
          product.isActive ? dict.deactivate : dict.activate
        }
        cancelText={dict.cancel}
        onConfirm={confirmToggleActive}
        onClose={cancelToggleActive}
        icon={
          product.isActive ? (
            <CircleOff className="h-3.5 w-3.5 text-danger" />
          ) :
            <PowerCircle className="h-7 w-7 text-primary" />
        }
        accent={product.isActive ? "danger" : "neutral"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ProductDetailsCard
          product={product}
          update={update}
          dict={dict}
          disabled={isInactive}
        />

        <div className="flex h-full flex-col gap-4 overflow-hidden">
          <ProductNamesCard
            names={product.productNames}
            disabled={isInactive}
            onAdd={(name) =>
              update("productNames", [
                ...product.productNames,
                name,
              ])
            }
            onRemove={(index) =>
              update(
                "productNames",
                product.productNames.filter(
                  (_, i) => i !== index
                )
              )
            }
            onMakeDefault={(index) => {
              const target = product.productNames[index];
              if (!target) return;

              update("productNames", [
                target,
                ...product.productNames.filter(
                  (_, i) => i !== index
                ),
              ]);
            }}
          />
        </div>

        <ProductHistoryCard productId={id as string} />
      </div>
    </div>
  );
}