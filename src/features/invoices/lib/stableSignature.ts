/**
 * Creates a stable JSON signature from a list by projecting each item.
 *
 * @param items - Source list in the current order.
 * @param projector - Maps each item to a normalized comparison shape.
 * @returns Canonical JSON string for dirty-check comparisons.
 */
export function createStableSignature<TItem, TProjection>(
  items: TItem[],
  projector: (item: TItem, index: number) => TProjection,
): string {
  return JSON.stringify(items.map(projector));
}
