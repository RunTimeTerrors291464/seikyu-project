"use client";

type ModalEscapeEntry = {
  id: number;
  onClose: () => void;
};

const stack: ModalEscapeEntry[] = [];
let nextEntryId = 1;
let windowKeydownListener: ((event: KeyboardEvent) => void) | null = null;

/**
 * Removes a stack entry by id (used when a modal closes without Escape).
 *
 * @param entryId - Registration id returned from the internal push.
 */
function removeEntryById(entryId: number): void {
  const index = stack.findIndex(function matchEntry(entry: ModalEscapeEntry): boolean {
    return entry.id === entryId;
  });
  if (index === -1) {
    return;
  }
  stack.splice(index, 1);
}

/**
 * Invokes the topmost modal close handler on Escape without popping the stack.
 *
 * Entries are removed only when the overlay unmounts and calls its unregister cleanup,
 * so a parent draft popup stays registered after Escape opens a nested confirm dialog.
 *
 * @param event - Native keydown event.
 */
function handleWindowKeydownCapture(event: KeyboardEvent): void {
  if (event.key !== "Escape") {
    return;
  }
  if (stack.length === 0) {
    return;
  }

  const topEntry = stack[stack.length - 1];
  event.preventDefault();
  event.stopPropagation();
  topEntry.onClose();
}

/**
 * Ensures the single global Escape listener is attached.
 */
function attachWindowListenerIfNeeded(): void {
  if (windowKeydownListener !== null) {
    return;
  }
  windowKeydownListener = handleWindowKeydownCapture;
  window.addEventListener("keydown", windowKeydownListener, true);
}

/**
 * Detaches the global listener when no modal is registered.
 */
function detachWindowListenerIfIdle(): void {
  if (stack.length !== 0) {
    return;
  }
  if (windowKeydownListener === null) {
    return;
  }
  window.removeEventListener("keydown", windowKeydownListener, true);
  windowKeydownListener = null;
}

/**
 * Pushes an open modal onto the Escape stack so only the top overlay handles each Escape press.
 *
 * @param onClose - Handler to run when this overlay is the stack top and Escape is pressed.
 * @returns Cleanup that removes this overlay from the stack (call when closing or unmounting).
 */
export function registerModalEscapeHandler(onClose: () => void): () => void {
  const id = nextEntryId;
  nextEntryId += 1;
  stack.push({ id, onClose });
  attachWindowListenerIfNeeded();

  return function unregisterModalEscapeHandler(): void {
    removeEntryById(id);
    detachWindowListenerIfIdle();
  };
}
