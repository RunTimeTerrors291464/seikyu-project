import { describe, expect, it } from "vitest";

import { cleanInvoiceListParams } from "@/lib/datetime/cleanInvoiceListParams";

describe("cleanInvoiceListParams", () => {
  it("removes undefined, null, and empty-string values", () => {
    const result = cleanInvoiceListParams({
      page: 1,
      search: "",
      status: undefined,
      fromDate: "2026-06-01",
      toDate: null,
    });

    expect(result).toEqual({
      page: 1,
      fromDate: "2026-06-01",
    });
  });

  it("returns an empty object when all values are empty", () => {
    expect(
      cleanInvoiceListParams({
        search: "",
        status: undefined,
      }),
    ).toEqual({});
  });

  it("preserves zero and false values", () => {
    expect(
      cleanInvoiceListParams({
        page: 0,
        includeDraft: false,
        search: "",
      }),
    ).toEqual({
      page: 0,
      includeDraft: false,
    });
  });
});
