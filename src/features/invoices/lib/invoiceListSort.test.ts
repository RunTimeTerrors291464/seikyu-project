import { describe, expect, it } from "vitest";

import {
  compareNullableString,
  sortReturnChildrenRows,
} from "@/features/invoices/lib/invoiceListSort";

type ChildRow = {
  returnInvoiceId: string | null;
  userName: string | null;
  createdAt: string | null;
};

const accessors = {
  getReturnInvoiceId: (row: ChildRow) => row.returnInvoiceId,
  getUserName: (row: ChildRow) => row.userName,
  getCreatedAt: (row: ChildRow) => row.createdAt,
};

describe("invoiceListSort", () => {
  it("sorts nullable strings ascending and descending", () => {
    expect(compareNullableString("b", "a", "asc")).toBeGreaterThan(0);
    expect(compareNullableString("a", "b", "desc")).toBeGreaterThan(0);
    expect(compareNullableString(null, "a", "asc")).toBeLessThan(0);
  });

  it("sorts return child rows by selected field", () => {
    const rows: ChildRow[] = [
      {
        returnInvoiceId: "R-002",
        userName: "Bob",
        createdAt: "2024-02-01",
      },
      {
        returnInvoiceId: "R-001",
        userName: "Alice",
        createdAt: "2024-01-01",
      },
    ];

    const sorted = sortReturnChildrenRows(
      rows,
      "returnInvoiceId",
      "asc",
      accessors,
    );

    expect(sorted.map((row) => row.returnInvoiceId)).toEqual(["R-001", "R-002"]);
  });
});
