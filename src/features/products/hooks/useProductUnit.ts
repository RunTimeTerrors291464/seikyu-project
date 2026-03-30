"use client";

import useDebounce from "@/lib/hooks/useDebounce";
import { useEffect, useState } from "react";
import {
  ProductUnit,
  ProductUnitUpdateResponse,
  productUnitService,
} from "../services/product.unit.service";

export function useProductUnit(search: string) {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(false);

  const [historyMap, setHistoryMap] = useState<
    Record<string, ProductUnitUpdateResponse["history"][]>
  >({});

  const debouncedSearch = useDebounce(search, 500);

  /* ───────── FETCH ───────── */

  async function fetchUnits() {
    setLoading(true);
    try {
      const res = await productUnitService.getAll({
        page: 1,
        limit: 20,
        search: debouncedSearch,
        isActive: "all",
      });

      setUnits(res.productUnits);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUnits();
  }, [debouncedSearch]);

  /* ───────── HELPERS ───────── */

  function replaceUnit(updated: ProductUnit) {
    setUnits((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    );
  }

  // function removeUnit(id: string) {
  //   setUnits((prev) => prev.filter((u) => u.id !== id));
  // }

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

  /* ───────── CRUD ───────── */

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

  /* ───────── ACTIVE / DEACTIVE ───────── */

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

  /* ───────── RETURN ───────── */

  return {
    units,
    loading,

    fetchUnits,

    createUnit,
    updateUnit,

    activateUnit,
    deactivateUnit,
    historyMap,
  };
}