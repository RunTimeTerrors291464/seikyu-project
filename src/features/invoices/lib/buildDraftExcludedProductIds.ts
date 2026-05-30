type DraftLineWithProductId = {
  localId: string;
  productId: string;
};

/**
 * Product ids already on the draft table, excluding the row currently loaded in the entry card.
 *
 * @param lines - Current draft product rows.
 * @param activeEditRowLocalId - `localId` being edited in the entry card, if any.
 * @returns Set of catalog product ids to exclude from SKU lookup / add-product pickers.
 */
export function buildDraftExcludedProductIds(
  lines: DraftLineWithProductId[],
  activeEditRowLocalId: string | null,
): Set<string> {
  return new Set(
    lines
      .filter(function excludeEditingLine(line): boolean {
        return line.localId !== activeEditRowLocalId;
      })
      .map(function mapProductId(line): string {
        return line.productId;
      })
      .filter(function filterEmptyProductId(productId): boolean {
        return productId.length > 0;
      }),
  );
}
