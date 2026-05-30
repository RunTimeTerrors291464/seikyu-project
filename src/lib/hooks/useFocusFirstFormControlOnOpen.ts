"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";

/**
 * Selector for the first text-like control in a modal body (skips checkboxes and disabled fields).
 */
export const FOCUS_FIRST_FORM_TEXT_CONTROL_SELECTOR =
  'input:not([type="checkbox"]):not([disabled]), textarea:not([disabled])' as const;

/**
 * Focuses the first non-checkbox, non-disabled text control under `root`.
 *
 * @param root - Container element to search within.
 */
export function focusFirstFormTextControl(root: HTMLElement): void {
  const control = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    FOCUS_FIRST_FORM_TEXT_CONTROL_SELECTOR,
  );
  control?.focus();
}

type UseFocusFirstFormControlOnOpenArgs = {
  /**
   * When true, schedules focusing the first eligible control under the returned ref after paint.
   */
  when: boolean;
  /**
   * When this value changes while `when` stays true, focus runs again (e.g. edited record id).
   */
  bumpKey?: string | number | null | undefined;
};

/**
 * Returns a ref for a dialog form region; when `when` is true, focuses the first text input or textarea after the next animation frame (works with portaled modals).
 *
 * @param args.when - Whether the overlay is ready for focus (typically `open` or `open && user != null`).
 * @param args.bumpKey - Optional key so switching context while open moves focus again.
 * @returns Ref to attach to the scrollable form wrapper inside the modal.
 */
export default function useFocusFirstFormControlOnOpen(
  args: UseFocusFirstFormControlOnOpenArgs,
): RefObject<HTMLDivElement | null> {
  const { when, bumpKey } = args;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    function scheduleFocusAfterOpen(): void | (() => void) {
      if (!when) {
        return;
      }
      const frameId = window.requestAnimationFrame(function runFocus(): void {
        const root = ref.current;
        if (!root) {
          return;
        }
        focusFirstFormTextControl(root);
      });
      return function cancelScheduledFocus(): void {
        window.cancelAnimationFrame(frameId);
      };
    },
    [when, bumpKey],
  );

  return ref;
}
