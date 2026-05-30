"use client";

import { useShortcutContext } from "@/lib/shortcuts/ShortcutRegisterContext";
import type { ShortcutRegistration } from "@/lib/shortcuts/types";
import { useEffect } from "react";

type UseShortcutArgs = ShortcutRegistration & {
  /**
   * When false, the shortcut is not registered until it becomes true again.
   */
  enabled?: boolean;
};

/**
 * Registers a keyboard shortcut for the lifetime of the component (or until deps change).
 *
 * @param args - Shortcut registration fields plus optional `enabled` guard.
 * @returns void
 */
export default function useShortcut(args: UseShortcutArgs): void {
  const { registerShortcut } = useShortcutContext();
  const {
    id,
    chord,
    handler,
    allowInEditable,
    priority,
    label,
    stopEvent,
    enabled = true,
  } = args;

  useEffect(
    function registerOrSkipShortcut(): void | (() => void) {
      if (!enabled) {
        return;
      }

      return registerShortcut({
        id,
        chord,
        handler,
        allowInEditable,
        priority,
        label,
        stopEvent,
      });
    },
    [
      allowInEditable,
      chord,
      enabled,
      handler,
      id,
      label,
      priority,
      registerShortcut,
      stopEvent,
    ],
  );
}
