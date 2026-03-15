export function paginate<T>(
  data: T[],
  page: number,
  limit: number
) {
  const start = (page - 1) * limit;

  return data.slice(start, start + limit);
}

export function getTotalPages(
  total: number,
  limit: number
) {
  return Math.max(1, Math.ceil(total / limit));
}