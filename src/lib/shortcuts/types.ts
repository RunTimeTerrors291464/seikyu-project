/**
 * Modifier and key description for a single keyboard chord.
 *
 * When `mod` is true, either `metaKey` or `ctrlKey` may satisfy the primary
 * modifier (Cmd on macOS, Ctrl on Windows/Linux).
 *
 * For `key`, use `KeyboardEvent.key` semantics in lowercase (for example
 * `"escape"`, `"enter"`, `"b"`). Prefer `code` when the physical key must match
 * regardless of layout (for example `"Backslash"`).
 */
export type ShortcutChord = {
  key?: string;
  code?: string;
  mod?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
};

/**
 * Registration passed to the shortcut registry.
 *
 * @property id - Stable identifier used for debugging and duplicate replacement.
 * @property chord - Key combination to match.
 * @property handler - Invoked when the chord matches; receives the native event.
 * @property allowInEditable - When false, the handler does not run while focus is in an editable control.
 * @property priority - Higher values run first; the first match wins.
 * @property label - Optional human label for future shortcut help surfaces.
 * @property stopEvent - When false, does not call `preventDefault` / `stopPropagation` after the handler.
 */
export type ShortcutRegistration = {
  id: string;
  chord: ShortcutChord;
  handler: (event: KeyboardEvent) => void;
  allowInEditable?: boolean;
  priority?: number;
  label?: string;
  stopEvent?: boolean;
};

export type ShortcutRegisterFn = (registration: ShortcutRegistration) => () => void;

export type ShortcutContextValue = {
  registerShortcut: ShortcutRegisterFn;
};

/**
 * One row in the keyboard shortcuts help dialog.
 *
 * @property id - Stable shortcut identifier.
 * @property label - Human-readable action name.
 * @property keysLabel - Formatted chord for display (OS-aware).
 */
export type ShortcutCatalogEntry = {
  id: string;
  label: string;
  keysLabel: string;
};
