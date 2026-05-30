"use client";

import { useEffect, useState } from "react";
import {
  getProductHistory,
  getProductHistoryDetail,
} from "../services/product.service";
import {
  ProductHistoryDetail,
  ProductHistoryItem,
} from "../types/product";

export function useProductHistory(productId: string) {
  const [history, setHistory] = useState<ProductHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailMap, setDetailMap] = useState<
    Record<number, ProductHistoryDetail>
  >({});
  const [loadingMap, setLoadingMap] = useState<
    Record<number, boolean>
  >({});

  /* ============================= */
  /* LIST FETCH */
  /* ============================= */

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      setLoading(true);

      try {
        const data = await getProductHistory(productId, { page: 1, limit: 100 });
        if (!isMounted) return;

        setHistory(data.history ?? []);
      } catch (err) {
        console.error("useProductHistory → fetch failed", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (productId) fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  /* ============================= */
  /* DETAIL FETCH (LAZY) */
  /* ============================= */

  async function fetchDetail(version: number) {
    if (detailMap[version] || loadingMap[version]) return;

    setLoadingMap((prev) => ({ ...prev, [version]: true }));

    try {
      const data = await getProductHistoryDetail(productId, version);

      setDetailMap((prev) => ({
        ...prev,
        [version]: data,
      }));
    } catch (err) {
      console.error(
        "useProductHistory → detail fetch failed",
        err
      );
    } finally {
      setLoadingMap((prev) => ({
        ...prev,
        [version]: false,
      }));
    }
  }

  return {
    history,
    loading,

    detailMap,
    loadingMap,

    fetchDetail,
    setHistory,
  };
}