"use client";

import { useEffect, useState } from "react";

import type { ProductQuery } from "@/features/products/services/product.service";
import { productService } from "@/features/products/services/product.service";
import type { ProductApi } from "@/features/products/types/productApi";

export function useProducts(query: ProductQuery) {

  const [products, setProducts] = useState<ProductApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {

    setLoading(true);

    try {

      const data = await productService.getProducts(query);

      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {
    fetchProducts();
  }, [query]);

  return {
    products,
    total,
    loading,
    refresh: fetchProducts
  };
}