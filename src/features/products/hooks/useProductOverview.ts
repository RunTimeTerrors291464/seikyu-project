"use client";

import { getProductOverview } from "@/features/products/services/product.service";
import { ProductOverview } from "@/features/products/types/product.overview";
import { useEffect, useState } from "react";

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