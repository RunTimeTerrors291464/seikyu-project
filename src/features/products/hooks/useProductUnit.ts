"use client";

import useDebounce from "@/lib/hooks/useDebounce";
import { useEffect, useState } from "react";
import {
  ProductUnit,
  productUnitService,
} from "../services/product.unit.service";

export function useProductUnit(search: string) {
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  async function fetchUnits() {
    setLoading(true);
    try {
      const res = await productUnitService.getAll({
        page: 1,
        limit: 20,
        search: debouncedSearch,
        isActive: "true",
      });

      setUnits(res.productUnits);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUnits();
  }, [debouncedSearch]);

  // ── CRUD ─────────────────────

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
    const updated = await productUnitService.update({
      id,
      unitName: name,
      unitDescription: desc,
    });

    setUnits((prev) =>
      prev.map((u) => (u.id === id ? updated : u))
    );

    return updated;
  }

  return {
    units,
    loading,
    fetchUnits,
    createUnit,
    updateUnit,
  };
}