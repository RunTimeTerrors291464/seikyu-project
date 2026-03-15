export type SortDirection = "asc" | "desc";

export type SortState = {
  field?: string;
  direction?: SortDirection;
};

export function sortData<T>(
  data: T[],
  field: keyof T,
  direction: SortDirection
) {
  const sorted = [...data].sort((a, b) => {

    const av = a[field];
    const bv = b[field];

    if (av === bv) return 0;

    if (direction === "asc") {
      return av > bv ? 1 : -1;
    }

    return av < bv ? 1 : -1;
  });

  return sorted;
}