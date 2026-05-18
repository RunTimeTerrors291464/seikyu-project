import type { ShortcutChord } from "@/lib/shortcuts/types";

/**
 * Normalizes `KeyboardEvent.key` for comparisons (case-insensitive single chars and words).
 *
 * @param key - Raw `event.key` value.
 * @returns Lowercase key string suitable for chord `key` fields.
 */
export function normalizeKeyboardKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key.toLowerCase();
}

/**
 * Checks modifier flags on a keyboard event against an expected chord.
 *
 * @param event - Native keyboard event.
 * @param chord - Expected modifier configuration.
 * @returns Whether every specified modifier requirement is satisfied.
 */
function modifiersMatch(event: KeyboardEvent, chord: ShortcutChord): boolean {
  if (chord.mod === true && !event.ctrlKey && !event.metaKey) {
    return false;
  }

  if (chord.mod === false && (event.ctrlKey || event.metaKey)) {
    return false;
  }

  if (chord.ctrl === true && !event.ctrlKey) {
    return false;
  }

  if (chord.ctrl === false && event.ctrlKey) {
    return false;
  }

  if (chord.meta === true && !event.metaKey) {
    return false;
  }

  if (chord.meta === false && event.metaKey) {
    return false;
  }

  if (chord.alt === true && !event.altKey) {
    return false;
  }

  if (chord.alt === false && event.altKey) {
    return false;
  }

  if (chord.shift === true && !event.shiftKey) {
    return false;
  }

  if (chord.shift === false && event.shiftKey) {
    return false;
  }

  if (chord.shift === undefined && event.shiftKey) {
    return false;
  }

  if (chord.alt === undefined && event.altKey) {
    return false;
  }

  if (chord.mod === undefined) {
    if (chord.ctrl === undefined && event.ctrlKey) {
      return false;
    }

    if (chord.meta === undefined && event.metaKey) {
      return false;
    }
  }

  return true;
}

/**
 * Returns true when `event` satisfies the given chord (key or code plus modifiers).
 *
 * @param event - Native keyboard event.
 * @param chord - Chord definition from a shortcut registration.
 * @returns Whether the event matches the chord.
 */
export function matchesShortcutChord(event: KeyboardEvent, chord: ShortcutChord): boolean {
  if (!modifiersMatch(event, chord)) {
    return false;
  }

  if (chord.code) {
    return event.code === chord.code;
  }

  if (chord.key) {
    return normalizeKeyboardKey(event.key) === chord.key.toLowerCase();
  }

  return false;
}
