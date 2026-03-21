"use client";

import { useEffect, useState } from "react";
import {
  activateProduct,
  deactivateProduct,
  getProductById,
  updateProduct,
} from "../services/product.service";
import type { Product } from "../types/product";

/* ============================= */
/* HOOK */
/* ============================= */

export function useProductDetail(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [original, setOriginal] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActivePopup, setShowActivePopup] = useState(false);

  /* ============================= */
  /* FETCH */
  /* ============================= */

  useEffect(() => {
    async function fetchProduct() {
      console.log("[useProductDetail] fetch → start", { id });

      setLoading(true);

      try {
        const data = await getProductById(id);

        console.log("[useProductDetail] fetch → success", data);

        setProduct(data);
        setOriginal(data);
      } catch (err) {
        console.error("[useProductDetail] fetch → error", err);
      } finally {
        setLoading(false);
        console.log("[useProductDetail] fetch → end");
      }
    }

    if (id) fetchProduct();
  }, [id]);

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
  /* TOGGLE ACTIVE */
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
  /* SAVE PRODUCT */
  /* ============================= */

  async function saveProduct() {
    if (!product || !original) return false;

    console.log("[useProductDetail] saveProduct → start", {
      product,
      original,
    });

    try {
      let updatedProduct = product;

      /* ============================= */
      /* 1. HANDLE ACTIVATE / DEACTIVATE */
      /* ============================= */

      if (product.isActive !== original.isActive) {
        console.log("[useProductDetail] active state changed");

        if (product.isActive) {
          console.log("[useProductDetail] calling ACTIVATE API");

          const res = await activateProduct(product.id);
          updatedProduct = res.data;
        } else {
          console.log("[useProductDetail] calling DEACTIVATE API");

          const res = await deactivateProduct(product.id);
          updatedProduct = res.data;
        }
      } else {
        /* ============================= */
        /* 2. HANDLE NORMAL UPDATE */
        /* ============================= */

        const hasFieldChanges =
          JSON.stringify(product) !== JSON.stringify(original);

        if (hasFieldChanges) {
          console.log("[useProductDetail] updating product fields");

          const payload: any = {
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

          updatedProduct = res;
        }
      }

      /* ============================= */
      /* 3. SYNC STATE */
      /* ============================= */

      setProduct(updatedProduct);
      setOriginal(updatedProduct);

      console.log("[useProductDetail] saveProduct → success");

      return true;
    } catch (err) {
      console.error("[useProductDetail] saveProduct → error", err);
      return false;
    }
  }

  /* ============================= */
  /* DIRTY CHECK */
  /* ============================= */

  const isDirty =
    JSON.stringify(product) !== JSON.stringify(original);

  console.log("[useProductDetail] isDirty → check", isDirty);
  const isInactive = product ? !product.isActive : false;
  const isActiveChanged =
    product?.isActive !== original?.isActive;
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

      const updated = {
        ...prev,
        productNames: [...prev.productNames, trimmed],
      };

      console.log("[useProductDetail] addName → result", updated);

      return updated;
    });
  }

  function removeName(index: number) {
    console.log("[useProductDetail] removeName", index);

    setProduct((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        productNames: prev.productNames.filter(
          (_, i) => i !== index
        ),
      };

      console.log("[useProductDetail] removeName → result", updated);

      return updated;
    });
  }

  function makeDefault(index: number) {
    console.log("[useProductDetail] makeDefault", index);

    setProduct((prev) => {
      if (!prev) return prev;

      const target = prev.productNames[index];
      if (!target) return prev;

      const updated = {
        ...prev,
        productNames: [
          target,
          ...prev.productNames.filter((_, i) => i !== index),
        ],
      };

      console.log("[useProductDetail] makeDefault → result", updated);

      return updated;
    });
  }

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

    // STATE
    isInactive,

    names: product?.productNames ?? [],
    addName,
    removeName,
    makeDefault,

    saveProduct,
    isDirty,
  };
}