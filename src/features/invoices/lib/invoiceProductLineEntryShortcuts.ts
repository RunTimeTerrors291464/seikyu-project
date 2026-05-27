import type { ShortcutChord } from "@/lib/shortcuts/types";

export const INVOICE_LINE_ENTRY_RESET_SHORTCUT_ID = "invoice.line-entry.reset";

export const INVOICE_LINE_ENTRY_RESET_SHORTCUT_PRIORITY = 2000;

export const INVOICE_LINE_ENTRY_RESET_SHORTCUT_FALLBACK_LABEL = "Reset line entry";

export const INVOICE_LINE_ENTRY_RESET_SHORTCUT_CHORD: ShortcutChord = {
  ctrl: true,
  code: "Semicolon",
};

/** Layout fallback when `event.code` is not `Semicolon` (e.g. some non-US keyboards). */
export const INVOICE_LINE_ENTRY_RESET_SHORTCUT_KEY_CHORD: ShortcutChord = {
  ctrl: true,
  key: ";",
};

export const INVOICE_LINE_ENTRY_ADD_SHORTCUT_CHORD: ShortcutChord = {
  key: "enter",
};
