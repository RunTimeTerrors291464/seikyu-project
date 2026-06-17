import { describe, expect, it } from "vitest";

import {
  getSkuCheckingHint,
  isSkuInputEmpty,
  normalizeSkuInput,
  skuInputMatchesProductSku,
} from "@/lib/sku/skuInputValidation";

describe("skuInputValidation", () => {
  it("normalizes SKU input to digits only", () => {
    expect(normalizeSkuInput("ab12-34x")).toBe("1234");
    expect(normalizeSkuInput("123456789012345")).toBe("1234567890123");
  });

  it("matches zero-padded catalog SKUs", () => {
    expect(skuInputMatchesProductSku("12", "0000000000012")).toBe(true);
    expect(skuInputMatchesProductSku("12", "0000000000013")).toBe(false);
    expect(skuInputMatchesProductSku("", "0000000000012")).toBe(false);
  });

  it("hides checking hints for empty SKU input", () => {
    expect(
      getSkuCheckingHint("", true, true, "Checking SKU..."),
    ).toBeUndefined();
    expect(
      getSkuCheckingHint("12", true, false, "Checking SKU..."),
    ).toBe("Checking SKU...");
  });

  it("detects empty SKU input", () => {
    expect(isSkuInputEmpty("")).toBe(true);
    expect(isSkuInputEmpty("0")).toBe(false);
  });
});
