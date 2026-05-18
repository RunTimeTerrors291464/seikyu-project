import type { ShortcutChord } from "@/lib/shortcuts/types";

const CODE_TO_LABEL: Record<string, string> = {
  Backslash: "\\",
  Comma: ",",
  Slash: "/",
  Space: "Space",
  Tab: "Tab",
  Enter: "Enter",
  Escape: "Esc",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Backspace: "Backspace",
  Delete: "Delete",
};

const KEY_TO_LABEL: Record<string, string> = {
  escape: "Esc",
  enter: "Enter",
  tab: "Tab",
  " ": "Space",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  backspace: "Backspace",
  delete: "Delete",
};

/**
 * Detects Apple-style platforms for modifier glyph choices.
 *
 * @returns True when the runtime reports macOS, iOS, iPadOS, or similar.
 */
function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Maps a `KeyboardEvent.code` value to a compact display label when known.
 *
 * @param code - DOM `KeyboardEvent.code` string.
 * @returns Human-readable key label.
 */
function formatCodeForDisplay(code: string): string {
  if (CODE_TO_LABEL[code]) {
    return CODE_TO_LABEL[code];
  }

  if (code.startsWith("Key")) {
    return code.slice("Key".length);
  }

  if (code.startsWith("Digit")) {
    return code.slice("Digit".length);
  }

  if (code.startsWith("Numpad")) {
    return `Num ${code.slice("Numpad".length)}`;
  }

  return code;
}

/**
 * Maps a normalized `KeyboardEvent.key` value to a compact display label.
 *
 * @param key - Lowercase logical key string.
 * @returns Human-readable key label.
 */
function formatKeyForDisplay(key: string): string {
  const mapped = KEY_TO_LABEL[key];
  if (mapped) {
    return mapped;
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  return key;
}

/**
 * Builds a human-readable shortcut label for UI (OS-aware primary modifier).
 *
 * @param chord - Shortcut chord definition.
 * @returns Display string such as `Ctrl + \` or `⌘ + /`.
 */
export function formatShortcutChordForDisplay(chord: ShortcutChord): string {
  const isApple = isApplePlatform();
  const segments: string[] = [];

  if (chord.ctrl === true) {
    segments.push(isApple ? "⌃" : "Ctrl");
  }

  if (chord.meta === true) {
    segments.push(isApple ? "⌘" : "Win");
  }

  if (chord.mod === true) {
    segments.push(isApple ? "⌘" : "Ctrl");
  }

  if (chord.alt === true) {
    segments.push(isApple ? "⌥" : "Alt");
  }

  if (chord.shift === true) {
    segments.push(isApple ? "⇧" : "Shift");
  }

  let main = "";
  if (chord.code) {
    main = formatCodeForDisplay(chord.code);
  } else if (chord.key) {
    main = formatKeyForDisplay(chord.key.toLowerCase());
  }

  if (!main) {
    return segments.join(" + ");
  }

  return [...segments, main].join(" + ");
}
