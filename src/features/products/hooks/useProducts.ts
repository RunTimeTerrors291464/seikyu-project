"use client";

import { getProductOverview, ProductQuery, productService } from "@/features/products/services/product.service";
import { useEffect, useState } from "react";
import type { Product, ProductOverview } from "../types/product";

/* ============================= */
/* HOOK: PRODUCTS LIST */
/* ============================= */

export function useProducts(query: ProductQuery) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ============================= */
  /* FETCH LIST */
  /* ============================= */

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      console.log("[useProducts] fetch → start", query);

      setLoading(true);

      try {
        const data = await productService.getProducts(query);

        console.log("[useProducts] fetch → success", {
          total: data.total,
          count: data.products?.length,
        });

        if (!isMounted) return;

        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);

        console.log("[useProducts] state updated");
      } catch (err) {
        console.error("[useProducts] fetch → error", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("[useProducts] fetch → end");
        }
      }
    }

    fetchProducts();

    return () => {
      console.log("[useProducts] cleanup → unmounted");
      isMounted = false;
    };
  }, [query]);

  /* ============================= */
  /* MANUAL REFRESH */
  /* ============================= */

  async function refresh() {
    console.log("[useProducts] refresh → start", query);

    try {
      const data = await productService.getProducts(query);

      console.log("[useProducts] refresh → success", {
        total: data.total,
        count: data.products?.length,
      });

      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);

      console.log("[useProducts] refresh → state updated");
    } catch (err) {
      console.error("[useProducts] refresh → error", err);
    }
  }

  /* ============================= */
  /* RETURN */
  /* ============================= */

  return {
    products,
    total,
    loading,
    refresh,
  };
}

/* ============================= */
/* HOOK: PRODUCT OVERVIEW */
/* ============================= */

export function useProductOverview() {
  const [data, setData] = useState<ProductOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ============================= */
  /* LOAD OVERVIEW */
  /* ============================= */

  useEffect(() => {
    async function load() {
      console.log("[useProductOverview] load → start");

      setLoading(true);
      setError("");

      try {
        const res = await getProductOverview();

        console.log("[useProductOverview] load → success", res);

        setData(res);
      } catch (err) {
        console.error("[useProductOverview] load → error", err);

        setError("Failed to load overview");
      } finally {
        setLoading(false);
        console.log("[useProductOverview] load → end");
      }
    }

    load();
  }, []);

  /* ============================= */
  /* RETURN */
  /* ============================= */

  return {
    data,
    loading,
    error,
  };
}