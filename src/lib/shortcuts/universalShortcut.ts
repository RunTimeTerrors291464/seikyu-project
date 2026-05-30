import { focusFirstFormTextControl } from "@/lib/hooks/useFocusFirstFormControlOnOpen";
import type { ShortcutChord } from "@/lib/shortcuts/types";

/**
 * Marks a region whose primary text search field should receive focus for the universal Ctrl+, shortcut.
 * Applied by `RuleInput` and manually on non-`RuleInput` search fields (for example unit picker).
 */
export const UNIVERSAL_SEARCH_ROOT_DATA_ATTR = "data-universal-search-root";

const UNIVERSAL_SEARCH_ROOT_SELECTOR = `[${UNIVERSAL_SEARCH_ROOT_DATA_ATTR}]`;

/**
 * Focuses the first text-like input inside the topmost `[data-universal-search-root]` subtree (last in document order, e.g. top portaled dialog).
 */
export function focusDeepestUniversalSearchTarget(): void {
  const list = document.querySelectorAll<HTMLElement>(UNIVERSAL_SEARCH_ROOT_SELECTOR);
  if (list.length === 0) {
    return;
  }
  const root = list.item(list.length - 1) as HTMLElement;
  focusFirstFormTextControl(root);
}

/**
 * Chord for the primary "create new" action on list screens (Ctrl+.).
 */
export const UNIVERSAL_NEW_SHORTCUT_CHORD: ShortcutChord = {
  ctrl: true,
  key: ".",
};

/**
 * Stable id so the shortcuts help dialog shows a single universal "New" row.
 */
export const UNIVERSAL_NEW_SHORTCUT_ID = "app.universal-new";

/**
 * English fallback for `app.universal-new` when resolving labels.
 */
export const UNIVERSAL_NEW_SHORTCUT_FALLBACK_LABEL = "New";

/** Whether `app.universal-new` (Ctrl+.) runs while focus is in an input. */
export const UNIVERSAL_NEW_SHORTCUT_ALLOW_IN_EDITABLE = true;

/**
 * Stable id for Ctrl+. on invoice product tables (opens add-by-SKU popup).
 */
export const INVOICE_ADD_PRODUCT_NEW_SHORTCUT_ID = "invoice.add-product";

/**
 * Runs before list-page `app.universal-new` (default priority 0) while invoice product UI is active.
 */
export const INVOICE_ADD_PRODUCT_NEW_SHORTCUT_PRIORITY = 2000;

/**
 * English fallback for `invoice.add-product` when resolving labels.
 */
export const INVOICE_ADD_PRODUCT_NEW_SHORTCUT_FALLBACK_LABEL = "Add product";

/**
 * Chord for focusing the active search region (Ctrl+,).
 */
export const UNIVERSAL_FOCUS_SEARCH_SHORTCUT_CHORD: ShortcutChord = {
  ctrl: true,
  code: "Comma",
};

/**
 * Stable id for the universal focus-search shortcut in the help catalog.
 */
export const UNIVERSAL_FOCUS_SEARCH_SHORTCUT_ID = "app.universal-focus-search";

/**
 * English fallback for `app.universal-focus-search` when resolving labels.
 */
export const UNIVERSAL_FOCUS_SEARCH_FALLBACK_LABEL = "Focus search";
