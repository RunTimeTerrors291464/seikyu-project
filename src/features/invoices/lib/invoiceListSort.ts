export type SortOrder = "asc" | "desc";

export type ReturnChildSortField = "returnInvoiceId" | "userId" | "createdAt";

/**
 * @param leftValue - Left-hand string, null treated as empty.
 * @param rightValue - Right-hand string, null treated as empty.
 * @param currentSortOrder - Active sort direction.
 */
export function compareNullableString(
  leftValue: string | null,
  rightValue: string | null,
  currentSortOrder: SortOrder,
): number {
  const left = leftValue ?? "";
  const right = rightValue ?? "";
  const baseCompare = left.localeCompare(right);
  return currentSortOrder === "asc" ? baseCompare : -baseCompare;
}

type ReturnChildSortAccessors<TChild> = {
  getReturnInvoiceId: (row: TChild) => string | null;
  getUserName: (row: TChild) => string | null;
  getCreatedAt: (row: TChild) => string | null;
};

/**
 * Sorts nested return-invoice rows client-side for expanded parent rows.
 */
export function sortReturnChildrenRows<TChild>(
  children: TChild[],
  currentSortBy: ReturnChildSortField | undefined,
  currentSortOrder: SortOrder,
  accessors: ReturnChildSortAccessors<TChild>,
): TChild[] {
  if (!currentSortBy) {
    return children;
  }

  const sorted = [...children];
  sorted.sort(function compareChildren(left, right): number {
    if (currentSortBy === "returnInvoiceId") {
      return compareNullableString(
        accessors.getReturnInvoiceId(left),
        accessors.getReturnInvoiceId(right),
        currentSortOrder,
      );
    }

    if (currentSortBy === "userId") {
      return compareNullableString(
        accessors.getUserName(left),
        accessors.getUserName(right),
        currentSortOrder,
      );
    }

    return compareNullableString(
      accessors.getCreatedAt(left),
      accessors.getCreatedAt(right),
      currentSortOrder,
    );
  });

  return sorted;
}
