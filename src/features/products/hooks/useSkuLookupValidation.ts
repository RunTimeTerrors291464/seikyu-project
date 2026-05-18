"use client";

import { getProductBySku } from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types/product";
import useDebounce from "@/lib/hooks/useDebounce";
import { useEffect, useRef, useState } from "react";

type UseSkuLookupValidationProps = {
  sku: string;
  skip?: boolean;
};

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

/**
 * Debounced lookup of an existing product by SKU (for add-to-invoice flows).
 *
 * @param props.sku - Raw SKU digits from the input.
 * @param props.skip - When true, skips network lookup.
 * @returns Debounce/check flags and the resolved product when found.
 */
export default function useSkuLookupValidation({
  sku,
  skip,
}: UseSkuLookupValidationProps) {
  const debouncedSku = useDebounce(sku, 800);
  const isDebouncing = sku !== debouncedSku;

  const [checking, setChecking] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  const cacheRef = useRef<Record<string, Product | null>>({});
  const activeRequest = useRef(0);

  useEffect(
    function lookupProductBySku(): void {
      if (skip || !/^\d{13}$/.test(debouncedSku)) {
        setProduct(null);
        setNotFound(false);
        return;
      }

      if (cacheRef.current[debouncedSku] !== undefined) {
        const cached = cacheRef.current[debouncedSku];
        setProduct(cached);
        setNotFound(cached === null);
        return;
      }

      const requestId = ++activeRequest.current;

      async function fetchProduct(): Promise<void> {
        try {
          setChecking(true);
          const resolved = (await getProductBySku(debouncedSku)) as Product;

          if (requestId !== activeRequest.current) {
            return;
          }

          cacheRef.current[debouncedSku] = resolved;
          setProduct(resolved);
          setNotFound(false);
        } catch (error: unknown) {
          if (requestId !== activeRequest.current) {
            return;
          }

          if (isNotFoundError(error)) {
            cacheRef.current[debouncedSku] = null;
            setProduct(null);
            setNotFound(true);
          } else {
            console.error("[useSkuLookupValidation]", error);
            setProduct(null);
            setNotFound(false);
          }
        } finally {
          if (requestId === activeRequest.current) {
            setChecking(false);
          }
        }
      }

      void fetchProduct();
    },
    [debouncedSku, skip],
  );

  return {
    isDebouncing,
    checking,
    product,
    notFound,
  };
}
