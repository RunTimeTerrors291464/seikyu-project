/**
 * `data-invoice-line-quantity` marks quantity inputs on invoice draft line tables.
 */
export const INVOICE_LINE_QUANTITY_DATA_ATTR = "data-invoice-line-quantity";

/**
 * Focuses the quantity input for a draft line row inside `root` (defaults to `document`).
 *
 * @param rowLocalId - `localId` of the editable line row.
 * @param root - Scope element (e.g. products card); when null, uses `document`.
 */
export function focusInvoiceLineQuantityInput(
  rowLocalId: string,
  root: ParentNode | null | undefined,
): void {
  if (!rowLocalId) {
    return;
  }

  const scope = root ?? document;
  const input = scope.querySelector<HTMLInputElement>(
    `input[${INVOICE_LINE_QUANTITY_DATA_ATTR}="${rowLocalId}"]`,
  );

  if (!input || input.disabled) {
    return;
  }

  input.focus();
  input.select();
}

/**
 * After React paints new rows, focuses the quantity field for `rowLocalId`.
 *
 * @param rowLocalId - `localId` of the line to focus.
 * @param root - Scope element containing the products table.
 */
export function scheduleFocusInvoiceLineQuantity(
  rowLocalId: string,
  root: HTMLElement | null,
): void {
  if (!rowLocalId) {
    return;
  }

  window.requestAnimationFrame(function waitForPaint(): void {
    window.requestAnimationFrame(function focusQuantity(): void {
      focusInvoiceLineQuantityInput(rowLocalId, root);
    });
  });
}

/**
 * Focuses the last row in `localIds` (typical target after adding one or many products).
 *
 * @param localIds - `localId` values for newly appended lines.
 * @param root - Scope element containing the products table.
 */
export function scheduleFocusLastInvoiceLineQuantity(
  localIds: ReadonlyArray<string>,
  root: HTMLElement | null,
): void {
  if (localIds.length === 0) {
    return;
  }

  const lastLocalId = localIds[localIds.length - 1];
  if (lastLocalId === undefined) {
    return;
  }

  scheduleFocusInvoiceLineQuantity(lastLocalId, root);
}
