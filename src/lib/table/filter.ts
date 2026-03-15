export function textFilter(value: string, search: string) {
  if (!search) return true;

  return value
    .toLowerCase()
    .includes(search.toLowerCase());
}

export function equalsFilter<T>(
  value: T,
  filter: T | "all"
) {
  if (filter === "all") return true;

  return value === filter;
}

export function booleanFilter(
  value: boolean,
  filter: "all" | "active" | "inactive"
) {
  if (filter === "all") return true;

  if (filter === "active") return value === true;

  return value === false;
}