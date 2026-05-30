import type { Dictionary } from "@/lib/lang/i18n";

const SHORTCUT_ID_TO_LABEL_KEY: Record<string, keyof Dictionary> = {
  "app-shell.toggle-sidebar": "shortcutLabelToggleSidebar",
  "shortcuts.open-help": "shortcutLabelOpenHelp",
  "app.universal-new": "shortcutLabelUniversalNew",
  "app.universal-focus-search": "shortcutLabelUniversalFocusSearch",
  "invoice.add-product": "addProduct",
};

/**
 * Maps a registered shortcut id to a localized catalog label when a dictionary key exists.
 *
 * @param dict - Active UI dictionary from `DictProvider`.
 * @param shortcutId - Stable shortcut id from `useShortcut` registration.
 * @param fallbackLabel - Registration `label` or id when no mapping exists.
 * @returns Localized label, or `fallbackLabel` when unmapped or missing string.
 */
export function resolveShortcutCatalogLabel(
  dict: Dictionary,
  shortcutId: string,
  fallbackLabel: string,
): string {
  const dictKey = SHORTCUT_ID_TO_LABEL_KEY[shortcutId];
  if (dictKey === undefined) {
    return fallbackLabel;
  }

  const value = dict[dictKey];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return fallbackLabel;
}
