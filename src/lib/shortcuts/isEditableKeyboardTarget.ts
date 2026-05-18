/**
 * Detects whether keyboard events should be treated as typing in a field.
 *
 * @param target - Event target from `KeyboardEvent.target`.
 * @returns True when focus is in an input, textarea, select, or contenteditable subtree.
 */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }

  return Boolean(target.closest("[contenteditable='true']"));
}
