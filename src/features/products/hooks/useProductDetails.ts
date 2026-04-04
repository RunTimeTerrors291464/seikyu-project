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
    productDescription: p.productDescription,
    importPrice: p.importPrice,
    sellingPrice: p.sellingPrice,
    reorderThreshold: p.reorderThreshold,
    isActive: p.isActive,
  };
}

/* ============================= */
/* HOOK */
/* ============================= */

export function useProductDetail(id: string) {
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
      setHistoryLoading(true);

      try {
        const [productData, historyData] = await Promise.all([
          getProductById(id),
          getProductHistory(id),
        ]);

        if (!isMounted) return;

        setProduct(productData);
        setOriginal(productData);
        setHistory(historyData ?? []);
      } catch (err) {
        console.error("[useProductDetail] fetch → error", err);
        toast.error("Failed to load product");
      } finally {
        if (isMounted) {
          setLoading(false);
          setHistoryLoading(false);
        }
      }
    }

    async function fetchHistory() {
      setHistoryLoading(true);

      try {
        const data = await getProductHistory(id);
        if (!isMounted) return;

        setHistory(data ?? []);
      } catch (err) {
        console.error("fetchHistory failed", err);
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    }

    if (id) fetchHistory();

    if (id) fetchAll();

    return () => {
      isMounted = false;
    };
  }, [id]);



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
    } catch (err) {
      console.error(
        "useProductDetail → detail fetch failed",
        err
      );
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
      console.log("[useProductDetail] blocked → inactive");
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
    console.log("[useProductDetail] requestToggleActive");

    setShowActivePopup(true);
  }

  function confirmToggleActive() {
    console.log("[useProductDetail] confirmToggleActive");

    setProduct((prev) => {
      if (!prev || !original) return prev;

      // If deactivating → revert ALL changes
      if (prev.isActive) {
        console.log("[useProductDetail] deactivating → revert changes");

        return {
          ...original,
          isActive: false,
        };
      }

      // If activating → just activate
      console.log("[useProductDetail] activating");

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
    console.log("[useProductDetail] addName", name);

    const trimmed = name.trim();
    if (!trimmed) return;

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
    console.log("[useProductDetail] removeName", index);

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
    console.log("[useProductDetail] makeDefault", index);

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

        setOriginal((prev) =>
          prev ? { ...prev, isActive: product.isActive } : prev
        );

        setProduct((prev) =>
          prev ? { ...prev, isActive: product.isActive } : prev
        );

        toast.success("Status updated");
        return true;
      }

      /* FIELDS */
      if (hasFieldChanges) {
        const payload: Partial<Product> & { id: string } = {
          id: product.id,
          productNames: product.productNames,
          productUnitId: product.productUnitId,
          productDescription: product.productDescription,
          importPrice: Number(product.importPrice),
          sellingPrice: Number(product.sellingPrice),
          reorderThreshold: Number(product.reorderThreshold),
        };

        if (product.sku !== original.sku) {
          payload.sku = product.sku;
        }

        const res = await updateProduct(payload);

        setProduct(res.product);
        setOriginal(res.product);

        // HISTORY UPDATE
        if (res.history) {
          addHistory(res.history);
        }

        toast.success("Product updated");
        return true;
      }

      return false;
    } catch (err) {
      console.error("[useProductDetail] saveProduct → error", err);
      toast.error("Failed to save product");
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

    addName,
    removeName,
    makeDefault,

    saveProduct,
    isDirty,
  };
}