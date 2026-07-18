"use client";

import {
  getProductBySku,
  peekProductBySku,
} from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types/product";
import useDebounce from "@/lib/hooks/useDebounce";
import { isSkuInputEmpty } from "@/lib/sku/skuInputValidation";
import { useEffect, useRef, useState } from "react";

export type SkuCheckIntent = "lookupExisting" | "checkDuplicate";

type UseSkuCheckProps = {
  sku: string;
  skip?: boolean;
  intent: SkuCheckIntent;
};

type UseSkuCheckResult = {
  isDebouncing: boolean;
  checking: boolean;
  product: Product | null;
  notFound: boolean;
  isDuplicate: boolean;
};

/**
 * Debounced SKU validation shared by invoice entry and product forms. Shared
 * cache hits resolve immediately; uncached SKU values wait 500 ms.
 */
export default function useSkuCheck({
  sku,
  skip = false,
  intent,
}: UseSkuCheckProps): UseSkuCheckResult {
  const debouncedSku = useDebounce(sku, 500);
  const cachedLookup = isSkuInputEmpty(sku) ? null : peekProductBySku(sku);
  const hasCachedLookup = cachedLookup !== null;
  const isDebouncing =
    !hasCachedLookup && !isSkuInputEmpty(sku) && sku !== debouncedSku;

  const [checking, setChecking] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const activeRequest = useRef(0);

  useEffect(
    function runSkuCheck(): void {
      // Advance on every input change, including cache hits, so an older request
      // cannot overwrite the result currently shown to the user.
      const requestId = ++activeRequest.current;

      function reset(): void {
        setChecking(false);
        setProduct(null);
        setNotFound(false);
        setIsDuplicate(false);
      }

      if (skip || isSkuInputEmpty(sku)) {
        reset();
        return;
      }

      // Shared-cache hits do not wait for the debounce. Other input waits until
      // typing/scanning has settled before reaching the API.
      if (!hasCachedLookup && sku !== debouncedSku) {
        reset();
        return;
      }

      const skuToLookup = hasCachedLookup ? sku : debouncedSku;

      async function fetchSkuCheck(): Promise<void> {
        try {
          setChecking(true);
          const resolved = await getProductBySku(skuToLookup);

          if (requestId !== activeRequest.current) {
            return;
          }

          if (intent === "lookupExisting") {
            setProduct(resolved);
            setNotFound(resolved === null);
            setIsDuplicate(false);
          } else {
            setIsDuplicate(resolved !== null);
            setProduct(null);
            setNotFound(false);
          }
        } catch (error: unknown) {
          if (requestId !== activeRequest.current) {
            return;
          }

          console.error("[useSkuCheck]", error);
          setProduct(null);
          setNotFound(false);
          setIsDuplicate(false);
        } finally {
          if (requestId === activeRequest.current) {
            setChecking(false);
          }
        }
      }

      void fetchSkuCheck();
    },
    [debouncedSku, hasCachedLookup, intent, skip, sku],
  );

  return {
    isDebouncing,
    checking,
    product,
    notFound,
    isDuplicate,
  };
}
