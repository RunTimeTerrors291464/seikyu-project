import type { Product } from "../types/product";

export type ProductSkuLookupResult = Product | null;

export type ProductSkuLookupCacheHit = {
  value: ProductSkuLookupResult;
};

type ProductSkuLookupCacheOptions = {
  productTtlMs?: number;
  notFoundTtlMs?: number;
  maxEntries?: number;
  now?: () => number;
};

type CacheEntry = {
  value: ProductSkuLookupResult;
  expiresAt: number;
};

const DEFAULT_PRODUCT_TTL_MS = 60_000;
const DEFAULT_NOT_FOUND_TTL_MS = 10_000;
const DEFAULT_MAX_ENTRIES = 200;

/**
 * Creates a bounded, TTL-based product lookup cache. Pending lookups are shared
 * so concurrent scans of the same SKU issue one request.
 */
export function createProductSkuLookupCache(
  options: ProductSkuLookupCacheOptions = {},
): {
  get: (
    sku: string,
    fetchProduct: (sku: string) => Promise<ProductSkuLookupResult>,
  ) => Promise<ProductSkuLookupResult>;
  peek: (sku: string) => ProductSkuLookupCacheHit | null;
  clear: () => void;
} {
  const productTtlMs = options.productTtlMs ?? DEFAULT_PRODUCT_TTL_MS;
  const notFoundTtlMs = options.notFoundTtlMs ?? DEFAULT_NOT_FOUND_TTL_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const now = options.now ?? Date.now;
  const cached = new Map<string, CacheEntry>();
  const inFlight = new Map<
    string,
    { token: symbol; request: Promise<ProductSkuLookupResult> }
  >();
  let generation = 0;

  function normalizedKey(sku: string): string {
    return sku.trim();
  }

  function store(key: string, value: ProductSkuLookupResult): void {
    const ttl = value === null ? notFoundTtlMs : productTtlMs;

    cached.delete(key);
    cached.set(key, { value, expiresAt: now() + ttl });

    while (cached.size > maxEntries) {
      const oldestKey = cached.keys().next().value;
      if (oldestKey === undefined) {
        return;
      }
      cached.delete(oldestKey);
    }
  }

  function peek(sku: string): ProductSkuLookupCacheHit | null {
    const key = normalizedKey(sku);
    const entry = cached.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= now()) {
      cached.delete(key);
      return null;
    }

    cached.delete(key);
    cached.set(key, entry);
    return { value: entry.value };
  }

  function get(
    sku: string,
    fetchProduct: (sku: string) => Promise<ProductSkuLookupResult>,
  ): Promise<ProductSkuLookupResult> {
    const key = normalizedKey(sku);
    const cachedResult = peek(key);
    if (cachedResult) {
      return Promise.resolve(cachedResult.value);
    }

    const pending = inFlight.get(key);
    if (pending) {
      return pending.request;
    }

    const requestGeneration = generation;
    const token = Symbol(key);
    const request = fetchProduct(key)
      .then((product) => {
        if (requestGeneration === generation) {
          store(key, product);
        }
        return product;
      })
      .finally(() => {
        if (inFlight.get(key)?.token === token) {
          inFlight.delete(key);
        }
      });

    inFlight.set(key, { token, request });
    return request;
  }

  function clear(): void {
    generation += 1;
    cached.clear();
    inFlight.clear();
  }

  return { get, peek, clear };
}

/** Shared in-memory cache for SKU lookups within the current browser tab. */
export const productSkuLookupCache = createProductSkuLookupCache();
