import { describe, expect, it, vi } from "vitest";
import type { Product } from "../types/product";
import { createProductSkuLookupCache } from "./productSkuLookupCache";

const product = { id: "product-1", sku: "1234567890123" } as Product;

describe("createProductSkuLookupCache", () => {
  it("shares concurrent lookups and reuses a cached product", async () => {
    const cache = createProductSkuLookupCache();
    let resolveRequest: ((value: Product | null) => void) | undefined;
    const fetchProduct = vi.fn(
      () => new Promise<Product | null>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = cache.get(product.sku, fetchProduct);
    const second = cache.get(product.sku, fetchProduct);

    expect(fetchProduct).toHaveBeenCalledTimes(1);
    resolveRequest?.(product);
    await expect(first).resolves.toBe(product);
    await expect(second).resolves.toBe(product);

    await expect(cache.get(product.sku, fetchProduct)).resolves.toBe(product);
    expect(fetchProduct).toHaveBeenCalledTimes(1);
  });

  it("expires cached not-found results after their shorter TTL", async () => {
    let time = 0;
    const cache = createProductSkuLookupCache({
      productTtlMs: 100,
      notFoundTtlMs: 10,
      now: () => time,
    });
    const fetchProduct = vi.fn(async () => null);

    await cache.get(product.sku, fetchProduct);
    await cache.get(product.sku, fetchProduct);
    expect(fetchProduct).toHaveBeenCalledTimes(1);

    time = 10;
    await cache.get(product.sku, fetchProduct);
    expect(fetchProduct).toHaveBeenCalledTimes(2);
  });

  it("does not restore an in-flight result after invalidation", async () => {
    const cache = createProductSkuLookupCache();
    let resolveRequest: ((value: Product | null) => void) | undefined;
    const fetchProduct = vi.fn(
      () => new Promise<Product | null>((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const pending = cache.get(product.sku, fetchProduct);
    cache.clear();
    resolveRequest?.(product);
    await pending;

    expect(cache.peek(product.sku)).toBeNull();
  });
});
