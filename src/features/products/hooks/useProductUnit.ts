"use client";

import useDebounce from "@/lib/hooks/useDebounce";
import { useEffect, useState } from "react";
import {
  ProductUnit,
  ProductUnitUpdateResponse,
  productUnitService,
} from "../services/product.unit.service";

export function useProductUnit(search: string, enabled = true) {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(false);

  const [historyMap, setHistoryMap] = useState<
    Record<string, ProductUnitUpdateResponse["history"][]>
  >({});

  const debouncedSearch = useDebounce(search, 500);

  useEffect(
    function markLoadingWhileSearchChanges(): void {
      if (!enabled) {
        return;
      }

      setLoading(true);
    },
    [search, enabled],
  );

  useEffect(
    function fetchUnitsWhenQueryChanges() {
      if (!enabled) {
        return;
      }

      let cancelled = false;

      async function fetchUnits(): Promise<void> {
        setLoading(true);

        try {
          const res = await productUnitService.getAll({
            page: 1,
            limit: 100,
            search: debouncedSearch,
            isActive: "all",
          });

          if (cancelled) {
            return;
          }

          setUnits(res.productUnits ?? []);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void fetchUnits();

      return function cancelInFlightFetch(): void {
        cancelled = true;
      };
    },
    [debouncedSearch, enabled],
  );

  function replaceUnit(updated: ProductUnit) {
    setUnits((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    );
  }

  function addHistory(
    unitId: string,
    history: ProductUnitUpdateResponse["history"] | undefined
  ) {
    if (!history) return;

    setHistoryMap((prev) => ({
      ...prev,
      [unitId]: [history, ...(prev[unitId] || [])],
    }));
  }

  async function createUnit(name: string, desc: string) {
    const unit = await productUnitService.create({
      unitName: name,
      unitDescription: desc,
    });

    setUnits((prev) => [unit, ...prev]);
    return unit;
  }

  async function updateUnit(
    id: string,
    name: string,
    desc: string
  ) {
    const res = await productUnitService.update({
      id,
      unitName: name,
      unitDescription: desc,
    });

    replaceUnit(res.productUnit);
    addHistory(id, res.history);

    return res.productUnit;
  }

  async function activateUnit(id: string) {
    const res = await productUnitService.activate(id);

    replaceUnit(res.productUnit);
    addHistory(id, res.history);

    return res.productUnit;
  }

  async function deactivateUnit(id: string) {
    const res = await productUnitService.deactivate(id);

    replaceUnit(res.productUnit);
    addHistory(id, res.history);

    return res.productUnit;
  }

  return {
    units,
    loading,

    createUnit,
    updateUnit,

    activateUnit,
    deactivateUnit,
    historyMap,
  };
}
