"use client";

import { getProductBySku } from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types/product";
import useDebounce from "@/lib/hooks/useDebounce";
import { isProductSkuNotFoundError } from "@/lib/sku/productSkuApiErrors";
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
 * Debounced `getProductBySku` check shared by invoice line entry and product forms.
 *
 * - `lookupExisting`: product must exist (invoice add line, add product popup).
 * - `checkDuplicate`: product must not exist (create/edit product SKU).
 *
 * @param props.sku - Raw SKU digits from the input.
 * @param props.skip - When true, skips the network request.
 * @param props.intent - How to interpret a found / missing product.
 * @returns Debounce flags and intent-specific lookup outcome fields.
 */
export default function useSkuCheck({
  sku,
  skip = false,
  intent,
}: UseSkuCheckProps): UseSkuCheckResult {
  const debouncedSku = useDebounce(sku, 800);
  const isDebouncing = sku !== debouncedSku;

  const [checking, setChecking] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const lookupCacheRef = useRef<Record<string, Product | null>>({});
  const duplicateCacheRef = useRef<Record<string, boolean>>({});
  const activeRequest = useRef(0);

  useEffect(
    function runSkuCheck(): void {
      console.log("runSkuCheck", skip, intent);
      if (skip
        // || !isSku13Format(debouncedSku)
      ) {
        setProduct(null);
        setNotFound(false);
        setIsDuplicate(false);
        return;
      }

      if (intent === "lookupExisting") {
        if (lookupCacheRef.current[debouncedSku] !== undefined) {
          const cached = lookupCacheRef.current[debouncedSku];
          setProduct(cached);
          setNotFound(cached === null);
          setIsDuplicate(false);
          return;
        }
      } else if (duplicateCacheRef.current[debouncedSku] !== undefined) {
        setIsDuplicate(duplicateCacheRef.current[debouncedSku]);
        setProduct(null);
        setNotFound(false);
        return;
      }

      const requestId = ++activeRequest.current;

      async function fetchSkuCheck(): Promise<void> {
        try {
          setChecking(true);
          const resolved = (await getProductBySku(debouncedSku)) as Product;

          if (requestId !== activeRequest.current) {
            return;
          }

          if (intent === "lookupExisting") {
            lookupCacheRef.current[debouncedSku] = resolved;
            setProduct(resolved);
            setNotFound(false);
            setIsDuplicate(false);
          } else {
            duplicateCacheRef.current[debouncedSku] = true;
            setIsDuplicate(true);
            setProduct(null);
            setNotFound(false);
          }
        } catch (error: unknown) {
          if (requestId !== activeRequest.current) {
            return;
          }

          if (isProductSkuNotFoundError(error)) {
            if (intent === "lookupExisting") {
              lookupCacheRef.current[debouncedSku] = null;
              setProduct(null);
              setNotFound(true);
              setIsDuplicate(false);
            } else {
              duplicateCacheRef.current[debouncedSku] = false;
              setIsDuplicate(false);
              setProduct(null);
              setNotFound(false);
            }
          } else {
            console.error("[useSkuCheck]", error);
            setProduct(null);
            setNotFound(false);
            setIsDuplicate(false);
          }
        } finally {
          if (requestId === activeRequest.current) {
            setChecking(false);
          }
        }
      }

      void fetchSkuCheck();
    },
    [debouncedSku, intent, skip],
  );

  return {
    isDebouncing,
    checking,
    product,
    notFound,
    isDuplicate,
  };
}
