import type { OrderedShortcutRegistration } from "@/lib/shortcuts/buildShortcutCatalog";
import { createShortcutCatalogStore } from "@/lib/shortcuts/shortcutCatalogStore";
import type { ShortcutCatalogStore } from "@/lib/shortcuts/shortcutCatalogStore";

export type ShortcutRegistryModel = {
  catalogStore: ShortcutCatalogStore;
  addRegistration: (entry: OrderedShortcutRegistration) => void;
  removeRegistration: (entry: OrderedShortcutRegistration) => void;
  getDispatchEntries: () => OrderedShortcutRegistration[];
};

/**
 * Creates a mutable shortcut registry plus catalog store without React refs.
 *
 * @returns API for dispatch, catalog updates, and listing entries.
 */
export function createShortcutRegistryModel(): ShortcutRegistryModel {
  let entries: OrderedShortcutRegistration[] = [];
  const catalogStore = createShortcutCatalogStore(function readRegistry() {
    return entries;
  });

  function addRegistration(entry: OrderedShortcutRegistration): void {
    entries = [...entries, entry];
    catalogStore.bump();
  }

  function removeRegistration(entry: OrderedShortcutRegistration): void {
    entries = entries.filter(function filterKeep(other) {
      return other !== entry;
    });
    catalogStore.bump();
  }

  function getDispatchEntries(): OrderedShortcutRegistration[] {
    return entries;
  }

  return { catalogStore, addRegistration, removeRegistration, getDispatchEntries };
}
