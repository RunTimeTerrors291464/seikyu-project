import { buildShortcutCatalog } from "@/lib/shortcuts/buildShortcutCatalog";
import type { OrderedShortcutRegistration } from "@/lib/shortcuts/buildShortcutCatalog";
import type { ShortcutCatalogEntry } from "@/lib/shortcuts/types";

export type ShortcutCatalogStore = {
  bump: () => void;
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
  getEntries: () => ShortcutCatalogEntry[];
};

/**
 * Creates a tiny external store so shortcut listings update without re-rendering unrelated subscribers.
 *
 * @param getRegistry - Returns the live shortcut registry snapshot.
 * @returns Store API used with `useSyncExternalStore`.
 */
export function createShortcutCatalogStore(
  getRegistry: () => OrderedShortcutRegistration[],
): ShortcutCatalogStore {
  let version = 0;
  const listeners = new Set<() => void>();

  function bump(): void {
    version += 1;
    listeners.forEach(function notifyEach(listener) {
      listener();
    });
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return function unsubscribe(): void {
      listeners.delete(listener);
    };
  }

  function getVersion(): number {
    return version;
  }

  function getEntries(): ShortcutCatalogEntry[] {
    return buildShortcutCatalog(getRegistry());
  }

  return { bump, subscribe, getVersion, getEntries };
}
