"use client";

import { ShortcutCatalogStoreContext } from "@/lib/shortcuts/ShortcutCatalogStoreContext";
import type { ShortcutCatalogEntry } from "@/lib/shortcuts/types";
import { useContext, useSyncExternalStore } from "react";

/**
 * Returns the current keyboard shortcut catalog for UI (for example the help dialog).
 *
 * @returns De-duplicated shortcut rows; updates when any shortcut registers or unmounts.
 * @throws When used outside `ShortcutProvider`.
 */
export default function useShortcutsCatalog(): ShortcutCatalogEntry[] {
  const store = useContext(ShortcutCatalogStoreContext);

  if (!store) {
    throw new Error("useShortcutsCatalog must be used within ShortcutProvider");
  }

  useSyncExternalStore(
    store.subscribe,
    store.getVersion,
    function getServerShortcutCatalogVersion() {
      return 0;
    },
  );

  return store.getEntries();
}
