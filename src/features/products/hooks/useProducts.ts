"use client";

import { getProductById, getProductOverview, ProductQuery, productService } from "@/features/products/services/product.service";
import { useEffect, useState } from "react";
import type { Product, ProductOverview } from "../types/product";


export function useProductDetail(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  /* ============================= */
  /* FETCH */
  /* ============================= */

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);

      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error("useProductDetail → fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchProduct();
  }, [id]);

  /* ============================= */
  /* UPDATE (GENERIC) */
  /* ============================= */

  function update<K extends keyof Product>(
    key: K,
    value: Product[K]
  ) {
    setProduct((prev) =>
      prev ? { ...prev, [key]: value } : prev
    );
  }

  /* ============================= */
  /* ACTIVE */
  /* ============================= */

  function toggleActive() {
    setProduct((prev) =>
      prev
        ? { ...prev, isActive: !prev.isActive }
        : prev
    );
  }

  /* ============================= */
  /* PRODUCT NAMES (string[]) */
  /* ============================= */

  function addName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    setProduct((prev) => {
      if (!prev) return prev;

      const exists = prev.productNames.some(
        (n) =>
          n.toLowerCase() === trimmed.toLowerCase()
      );

      if (exists) return prev;

      return {
        ...prev,
        productNames: [
          ...prev.productNames,
          trimmed,
        ],
      };
    });
  }

  function removeName(index: number) {
    setProduct((prev) =>
      prev
        ? {
          ...prev,
          productNames:
            prev.productNames.filter(
              (_, i) => i !== index
            ),
        }
        : prev
    );
  }

  function makeDefault(index: number) {
    setProduct((prev) => {
      if (!prev) return prev;

      const target =
        prev.productNames[index];

      if (!target) return prev;

      return {
        ...prev,
        productNames: [
          target,
          ...prev.productNames.filter(
            (_, i) => i !== index
          ),
        ],
      };
    });
  }

  /* ============================= */
  /* RETURN */
  /* ============================= */

  return {
    product,
    loading,

    update,
    toggleActive,

    names: product?.productNames ?? [],

    addName,
    removeName,
    makeDefault,
  };


}

export function useProductOverview() {

  const [data, setData] = useState<ProductOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {

    async function load() {
      try {
        setLoading(true);

        const res = await getProductOverview();
        setData(res);

      } catch (err) {
        console.error("PRODUCT OVERVIEW ERROR", err);
        setError("Failed to load overview");

      } finally {
        setLoading(false);
      }
    }

    load();

  }, []);

  return {
    data,
    loading,
    error,
  };
}

export function useProducts(query: ProductQuery) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ============================= */
  /* FETCH */
  /* ============================= */

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      setLoading(true);

      try {
        const data =
          await productService.getProducts(query);

        if (!isMounted) return;

        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        console.error(
          "useProducts → fetch failed",
          err
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [query]);

  /* ============================= */
  /* RETURN */
  /* ============================= */

  return {
    products,
    total,
    loading,

    // manual refresh if needed
    refresh: async () => {
      const data =
        await productService.getProducts(query);

      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
    },
  };
}