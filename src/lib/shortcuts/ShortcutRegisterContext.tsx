"use client";

import type { ShortcutContextValue, ShortcutRegisterFn } from "@/lib/shortcuts/types";
import { createContext, useContext } from "react";

const ShortcutRegisterContext = createContext<ShortcutRegisterFn | null>(null);

export { ShortcutRegisterContext };

/**
 * Reads the shortcut registration API from context.
 *
 * @returns Shortcut registration API.
 * @throws When used outside `ShortcutProvider`.
 */
export function useShortcutContext(): ShortcutContextValue {
  const registerShortcut = useContext(ShortcutRegisterContext);

  if (!registerShortcut) {
    throw new Error("useShortcutContext must be used within ShortcutProvider");
  }

  return { registerShortcut };
}
