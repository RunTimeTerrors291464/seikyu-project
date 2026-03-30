"use client";

import { getProductBySku } from "@/features/products/services/product.service";
import useDebounce from "@/lib/hooks/useDebounce";
import { useEffect, useRef, useState } from "react";

type UseSkuValidationProps = {
  sku: string;
  skip?: boolean;
};

export default function useSkuValidation({
  sku,
  skip,
}: UseSkuValidationProps) {
  const debouncedSku = useDebounce(sku, 800);
  const isDebouncing = sku !== debouncedSku;

  const [checking, setChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // cache: sku → boolean (true = duplicate)
  const cacheRef = useRef<Record<string, boolean>>({});

  // prevent race conditions
  const activeRequest = useRef(0);

  useEffect(() => {
    // only validate valid SKU
    if (skip || !/^\d{13}$/.test(debouncedSku)) {
      setIsDuplicate(false);
      return;
    }

    // check cache first
    if (cacheRef.current[debouncedSku] !== undefined) {
      setIsDuplicate(cacheRef.current[debouncedSku]);
      return;
    }

    let requestId = ++activeRequest.current;

    async function check() {
      try {
        setChecking(true);

        await getProductBySku(debouncedSku);

        // if outdated request → ignore
        if (requestId !== activeRequest.current) return;

        // exists → duplicate
        cacheRef.current[debouncedSku] = true;
        setIsDuplicate(true);
      } catch (error: unknown) {
        if (requestId !== activeRequest.current) return;

        const hasNotFoundStatus =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: unknown }).response === "object" &&
          (error as { response?: { status?: number } }).response
            ?.status === 404;

        if (hasNotFoundStatus) {
          // not found → valid SKU
          cacheRef.current[debouncedSku] = false;
          setIsDuplicate(false);
        } else {
          console.error("[useSkuValidation]", error);
        }
      } finally {
        if (requestId === activeRequest.current) {
          setChecking(false);
        }
      }
    }

    check();
  }, [debouncedSku]);

  return {
    isDebouncing,
    checking,
    isDuplicate,
  };
}