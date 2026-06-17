"use client";

import { useEffect, useState } from "react";
import {
    activateProduct,
    deactivateProduct,
    getProductById,
    getProductHistory,
    getProductHistoryDetail,
    updateProduct,
} from "../services/product.service";

import { toast } from "sonner";
import type {
    Product,
    ProductHistoryDetail,
    ProductHistoryItem,
} from "../types/product";

import { useIsDirty } from "@/lib/hooks/useIsDirty";
import { useDict } from "@/lib/lang/DictProvider";

/* ============================= */
/* HELPER */
/* ============================= */

function getComparable(p: Product | null) {
  if (!p) return null;

  return {
    sku: p.sku,
    // Order matters: index 0 is the primary/display name; do not sort.
    productNames: JSON.stringify(p.productNames),
    productUnitId: p.productUnitId,
    productDescription: String(p.productDescription ?? "").trim(),
    importPrice: Number(p.importPrice),
    sellingPrice: Number(p.sellingPrice),
    reorderThreshold: Number(p.reorderThreshold),
    isActive: p.isActive,
  };
}

/**
 * Builds a PATCH body with only fields that differ from the last saved product.
 *
 * @param product - Current draft product state.
 * @param original - Last saved product from the server.
 * @returns Payload for `PATCH /products` (always includes `id`).
 */
function buildProductUpdatePatch(
  product: Product,
  original: Product,
): Partial<Product> & { id: string } {
  const payload: Partial<Product> & { id: string } = {
    id: product.id,
  };

  if (product.sku !== original.sku) {
    payload.sku = product.sku;
  }

  if (
    JSON.stringify(product.productNames) !==
    JSON.stringify(original.productNames)
  ) {
    payload.productNames = product.productNames;
  }

  if (product.productUnitId !== original.productUnitId) {
    payload.productUnitId = product.productUnitId;
  }

  const descriptionChanged =
    String(product.productDescription ?? "").trim() !==
    String(original.productDescription ?? "").trim();
  if (descriptionChanged) {
    payload.productDescription = product.productDescription;
  }

  if (Number(product.importPrice) !== Number(original.importPrice)) {
    payload.importPrice = Number(product.importPrice);
  }

  if (Number(product.sellingPrice) !== Number(original.sellingPrice)) {
    payload.sellingPrice = Number(product.sellingPrice);
  }

  if (Number(product.reorderThreshold) !== Number(original.reorderThreshold)) {
    payload.reorderThreshold = Number(product.reorderThreshold);
  }

  return payload;
}

/**
 * True when the user enabled the product locally but the last saved row is still inactive.
 * Field edits should stay blocked until activation is persisted.
 *
 * @param product - Current draft product.
 * @param original - Last saved product from the server.
 * @returns Whether activation-only save is still pending.
 */
function isPendingActivationSave(
  product: Product | null,
  original: Product | null,
): boolean {
  return Boolean(
    product && original && !original.isActive && product.isActive,
  );
}

/* ============================= */
/* HOOK */
/* ============================= */

export function useProductDetail(
  id: string,
  options?: { loadHistory?: boolean },
) {
  const dict = useDict();
  const loadHistory = options?.loadHistory ?? true;
  const [product, setProduct] = useState<Product | null>(null);
  const [original, setOriginal] = useState<Product | null>(null);

  /* ============================= */
  /* HISTORY (PORTED) */
  /* ============================= */

  const [history, setHistory] = useState<ProductHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [detailMap, setDetailMap] = useState<
    Record<number, ProductHistoryDetail>
  >({});
  const [loadingMap, setLoadingMap] = useState<
    Record<number, boolean>
  >({});

  /* ============================= */
  /* OTHER STATE */
  /* ============================= */

  const [loading, setLoading] = useState(true);
  const [showActivePopup, setShowActivePopup] = useState(false);

  const checkDirty = useIsDirty<NonNullable<ReturnType<typeof getComparable>>>();

  /* ============================= */
  /* FETCH (PRODUCT + HISTORY) */
  /* ============================= */

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setLoading(true);
      setHistoryLoading(loadHistory);

      try {
        if (loadHistory) {
          const [productData, historyData] = await Promise.all([
            getProductById(id),
            getProductHistory(id, { page: 1, limit: 100 }),
          ]);

          if (!isMounted) return;

          setProduct(productData);
          setOriginal(productData);
          setHistory(historyData.history ?? []);
          return;
        }

        const productData = await getProductById(id);

        if (!isMounted) return;

        setProduct(productData);
        setOriginal(productData);
        setHistory([]);
      } catch {
        toast.error(dict.productLoadFailed);
      } finally {
        if (isMounted) {
          setLoading(false);
          setHistoryLoading(false);
        }
      }
    }

    if (id) {
      void fetchAll();
    }

    return () => {
      isMounted = false;
    };
  }, [id, loadHistory]);



  /* ============================= */
  /* HISTORY DETAIL FETCH  */
  /* ============================= */

  async function fetchDetail(version: number) {
    if (detailMap[version] || loadingMap[version]) return;

    setLoadingMap((prev) => ({ ...prev, [version]: true }));

    try {
      const data = await getProductHistoryDetail(id, version);

      setDetailMap((prev) => ({
        ...prev,
        [version]: data,
      }));
    } catch {
      // Ignore detail fetch failures; row stays collapsed.
    } finally {
      setLoadingMap((prev) => ({
        ...prev,
        [version]: false,
      }));
    }
  }

  /* ============================= */
  /* UPDATE LOCAL STATE */
  /* ============================= */

  function update<K extends keyof Product>(
    key: K,
    value: Product[K]
  ) {
    if (product && !product.isActive) {
      return;
    }

    if (isPendingActivationSave(product, original)) {
      return;
    }

    setProduct((prev) => {
      if (!prev) return prev;

      return { ...prev, [key]: value };
    });
  }

  /* ============================= */
  /* ACTIVE TOGGLE */
  /* ============================= */

  function requestToggleActive() {
    setShowActivePopup(true);
  }

  function confirmToggleActive() {
    setProduct((prev) => {
      if (!prev || !original) return prev;

      // If deactivating → revert ALL changes
      if (prev.isActive) {
        return {
          ...original,
          isActive: false,
        };
      }

      return {
        ...prev,
        isActive: true,
      };
    });

    setShowActivePopup(false);
  }

  function cancelToggleActive() {
    setShowActivePopup(false);
  }

  /* ============================= */
  /* PRODUCT NAMES */
  /* ============================= */

  function addName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isPendingActivationSave(product, original)) {
      return;
    }

    setProduct((prev) => {
      if (!prev) return prev;

      const exists = prev.productNames.some(
        (n) => n.toLowerCase() === trimmed.toLowerCase()
      );

      if (exists) return prev;

      return {
        ...prev,
        productNames: [...prev.productNames, trimmed],
      };
    });
  }

  function removeName(index: number) {
    if (isPendingActivationSave(product, original)) {
      return;
    }

    setProduct((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        productNames: prev.productNames.filter(
          (_, i) => i !== index
        ),
      };
    });
  }

  function makeDefault(index: number) {
    if (isPendingActivationSave(product, original)) {
      return;
    }

    setProduct((prev) => {
      if (!prev) return prev;

      const target = prev.productNames[index];
      if (!target) return prev;

      return {
        ...prev,
        productNames: [
          target,
          ...prev.productNames.filter((_, i) => i !== index),
        ],
      };
    });
  }

  /* ============================= */
  /* HISTORY UPDATE */
  /* ============================= */

  function addHistory(newHistory: ProductHistoryItem) {
    if (!newHistory) return;

    setHistory((prev) => {
      const exists = prev.some((h) => h.id === newHistory.id);
      if (exists) return prev;

      return [newHistory, ...prev];
    });
  }

  /* ============================= */
  /* SAVE */
  /* ============================= */

  async function saveProduct(): Promise<boolean> {
    if (!product || !original) return false;

    try {
      const hasActiveChange =
        product.isActive !== original.isActive;

      const hasFieldChanges = checkDirty(
        getComparable(original) ?? undefined,
        getComparable(product) ?? undefined
      );

      if (!hasActiveChange && !hasFieldChanges) {
        return true;
      }

      /* ACTIVE */
      if (hasActiveChange) {
        const res = product.isActive
          ? await activateProduct(product.id)
          : await deactivateProduct(product.id);

        if (!res) return false;

        // HISTORY UPDATE
        if (res.history) {
          addHistory(res.history);
        }

        setOriginal((prev) =>
          prev ? { ...prev, isActive: product.isActive } : prev
        );

        setProduct((prev) =>
          prev ? { ...prev, isActive: product.isActive } : prev
        );

        toast.success(dict.productStatusUpdatedSuccess);
        return true;
      }

      /* FIELDS */
      if (hasFieldChanges) {
        const payload = buildProductUpdatePatch(product, original);

        if (Object.keys(payload).length <= 1) {
          return true;
        }

        const res = await updateProduct(payload);

        setProduct(res.product);
        setOriginal(res.product);

        // HISTORY UPDATE
        if (res.history) {
          addHistory(res.history);
        }

        toast.success(dict.productUpdatedSuccess);
        return true;
      }

      return false;
    } catch {
      toast.error(dict.productSaveFailed);
      return false;
    }
  }

  /* ============================= */
  /* STATE */
  /* ============================= */

  const isDirty = checkDirty(
    getComparable(original) ?? undefined,
    getComparable(product) ?? undefined
  );

  const isInactive = product ? !product.isActive : false;

  const pendingActivationSave = isPendingActivationSave(product, original);

  /* ============================= */
  /* RETURN */
  /* ============================= */

  return {
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
    pendingActivationSave,

    addName,
    removeName,
    makeDefault,

    saveProduct,
    isDirty,
  };
}