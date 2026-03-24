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
  // DETAILS HOOK
  const {
    product,
    loading,

    update,

    // ACTIVE FLOW
    requestToggleActive,
    confirmToggleActive,
    cancelToggleActive,
    showActivePopup,

    // HISTORY
    history,
    historyLoading,
    detailMap,
    loadingMap,
    fetchDetail,

    // STATE
    isInactive,

    addName,
    removeName,
    makeDefault,

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

  const primaryName =
    product.productNames?.length
      ? product.productNames[0]
      : "-";

  return (
    <div className="flex flex-col h-full space-y-6 max-h-[100vh]">
      {/* HEADER */}
      <ProductHeader
        name={primaryName}
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
          ) : (
            <PowerCircle className="h-7 w-7 text-primary" />
          )
        }
        accent={product.isActive ? "danger" : "neutral"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
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
            onAdd={addName}
            onRemove={removeName}
            onMakeDefault={makeDefault}
          />
        </div>

        <ProductHistoryCard
          history={history}
          loading={historyLoading}
          detailMap={detailMap}
          loadingMap={loadingMap}
          fetchDetail={fetchDetail}
        />
      </div>
    </div>
  );
}