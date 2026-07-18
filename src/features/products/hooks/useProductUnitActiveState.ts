"use client";

import { useEffect, useState } from "react";
import {
  ProductUnit,
  productUnitService,
} from "../services/product.unit.service";

/**
 * Resolves whether a product unit is currently active on the server.
 *
 * Looks up the unit by id using list search, then falls back to name search
 * if the id search does not return a matching row.
 *
 * @param productUnitId - Unit identifier from the product row.
 * @param productUnitName - Display name used when id-based search is inconclusive.
 * @param refreshKey - Changes when product data is refreshed from the server (e.g. `updatedAt`).
 * @param refreshNonce - Increments when unit data may have changed on the server outside
 *   of this product row (e.g. unit reactivated from the unit picker).
 * @returns `true` if active, `false` if inactive, `null` while loading or if not found.
 */
export function useProductUnitActiveState(
  productUnitId: string,
  productUnitName: string,
  refreshKey: string,
  refreshNonce: number
): boolean | null {
  const [isActive, setIsActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!productUnitId) {
      return;
    }

    let cancelled = false;

    async function resolve(): Promise<void> {
      setIsActive(null);

      try {
        const byIdSearch = await productUnitService.getAll({
          page: 1,
          limit: 50,
          search: productUnitId,
          isActive: "all",
        });

        if (cancelled) {
          return;
        }

        let unit = byIdSearch.productUnits.find(
          (u: ProductUnit) => u.id === productUnitId
        );

        if (!unit && productUnitName.trim()) {
          const byNameSearch = await productUnitService.getAll({
            page: 1,
            limit: 50,
            search: productUnitName.trim(),
            isActive: "all",
          });

          if (cancelled) {
            return;
          }

          unit = byNameSearch.productUnits.find(
            (u: ProductUnit) => u.id === productUnitId
          );
        }

        if (cancelled) {
          return;
        }

        setIsActive(unit ? unit.isActive : null);
      } catch {
        if (!cancelled) {
          setIsActive(null);
        }
      }
    }

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [productUnitId, productUnitName, refreshKey, refreshNonce]);

  return productUnitId ? isActive : null;
}
