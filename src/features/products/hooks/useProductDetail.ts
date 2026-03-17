"use client";

import {
  mapProductDetail,
  ProductDetail
} from "@/features/products/services/product.mapper";
import { useEffect, useState } from "react";
import { getProductById } from "../services/product.service";

export function useProductDetail(id: string) {

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* ============================= */
  /* FETCH */
  /* ============================= */

  useEffect(() => {

    async function fetchProduct() {

      setLoading(true);

      try {
        const res = await getProductById(id);
        const mapped = mapProductDetail(res);

        setProduct(mapped);

      } catch (err) {
        console.error("HOOK → fetchProduct failed", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();

  }, [id]);

  /* ============================= */
  /* UPDATE (LOCAL ONLY FOR NOW) */
  /* ============================= */

  function update(key: keyof ProductDetail, value: any) {
    setProduct((p) => (p ? { ...p, [key]: value } : p));
  }

  function toggleActive() {
    setProduct((p) =>
      p ? { ...p, active: !p.active } : p
    );
  }

  /* ============================= */
  /* NAMES */
  /* ============================= */

  function addName(name: string) {
    setProduct((p) =>
      p
        ? {
          ...p,
          names: [
            ...p.names,
            { id: Date.now().toString(), name }
          ]
        }
        : p
    );
  }

  function removeName(id: string) {
    setProduct((p) =>
      p
        ? {
          ...p,
          names: p.names.filter((n) => n.id !== id)
        }
        : p
    );
  }

  function makeDefault(id: string) {
    setProduct((p) => {
      if (!p) return p;

      const target = p.names.find((n) => n.id === id);

      return {
        ...p,
        names: [
          target!,
          ...p.names.filter((n) => n.id !== id)
        ],
        productName: target!.name
      };
    });
  }

  return {
    product,
    loading,

    update,
    toggleActive,

    names: product?.names || [],
    addName,
    removeName,
    makeDefault
  };
}