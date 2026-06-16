"use client";

import { ConfirmPopup } from "@/components/layout/Popup";
import { useProductDetail } from "@/features/products/hooks/useProductDetails";
import ProductDetailsCard from "@/features/products/layout/ProductDetailsCard";
import ProductHeader from "@/features/products/layout/ProductHeader";
import ProductHistoryCard from "@/features/products/layout/ProductHistoryCard";
import ProductNamesCard from "@/features/products/layout/ProductNamesCard";
import { useDraftNavigationGuard } from "@/lib/hooks/useDraftNavigationGuard";
import {
  useMayUseManagerWorkflowControls,
  useMayViewProductHistory,
} from "@/lib/hooks/useManagerWorkflowAccess";
import { useDict } from "@/lib/lang/DictProvider";
import { CircleOff, PowerCircle } from "lucide-react";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ProductInventoryDetailPage() {
  const [skuState, setSkuState] = useState({
    debouncing: false,
    checking: false,
    duplicate: false,
  });
  const { id } = useParams();
  const productId = typeof id === "string" ? id : "";
  const dict = useDict();
  const canManage = useMayUseManagerWorkflowControls();
  const canViewHistory = useMayViewProductHistory();

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
    pendingActivationSave,
  } = useProductDetail(productId, { loadHistory: canViewHistory });

  const canEditDraft = Boolean(product?.isActive);
  const {
    requestNavigate,
    discardNavigateOpen,
    confirmDiscardNavigate,
    closeDiscardNavigate,
  } = useDraftNavigationGuard(canEditDraft, isDirty);

  if (loading || !product) return null;

  const primaryName =
    product.productNames?.length
      ? product.productNames[0]
      : "-";
  const hasValidSkuFormat = /^\d{13}$/.test(
    String(product.sku || "")
  );

  const hasUnitSelected = Boolean(product.productUnitId?.trim());

  async function handleSave(): Promise<boolean> {
    if (!pendingActivationSave && !hasUnitSelected) {
      toast.error(dict.unitRequired);
      return false;
    }

    return saveProduct();
  }

  return (
    <div className="flex flex-col h-full space-y-6 max-h-[100vh]">
      {/* HEADER */}
      <ProductHeader
        name={primaryName}
        createdAt={product.createdAt}
        updatedAt={product.updatedAt}
        active={product.isActive}
        onToggleActive={requestToggleActive}
        onSave={handleSave}
        allowManagementActions={canManage}
        canSave={
          isDirty &&
          (pendingActivationSave ||
            (hasValidSkuFormat &&
              hasUnitSelected &&
              !skuState.debouncing &&
              !skuState.checking &&
              !skuState.duplicate))
        }
        onBack={function handleBack(): void {
          requestNavigate("/manager/product-inventory");
        }}
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

      <div
        className={clsx(
          "grid grid-cols-1 gap-4 flex-1 min-h-0",
          canViewHistory ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        <ProductDetailsCard
          product={product}
          update={update}
          dict={dict}
          disabled={!canManage || isInactive || pendingActivationSave}
          onSkuStateChange={setSkuState}
        />

        <div className="flex h-full flex-col gap-4 overflow-hidden">
          <ProductNamesCard
            names={product.productNames}
            disabled={!canManage || isInactive || pendingActivationSave}
            onAdd={addName}
            onRemove={removeName}
            onMakeDefault={makeDefault}
          />
        </div>

        {canViewHistory && (
          <ProductHistoryCard
            history={history}
            loading={historyLoading}
            detailMap={detailMap}
            loadingMap={loadingMap}
            fetchDetail={fetchDetail}
          />
        )}
      </div>
    </div>
  );
}