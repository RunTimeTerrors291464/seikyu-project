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
      } catch (err: any) {
        if (requestId !== activeRequest.current) return;

        if (err?.response?.status === 404) {
          // not found → valid SKU
          cacheRef.current[debouncedSku] = false;
          setIsDuplicate(false);
        } else {
          console.error("[useSkuValidation]", err);
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
    checking,
    isDuplicate,
  };
}