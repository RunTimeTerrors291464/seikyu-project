import { formatShortcutChordForDisplay } from "@/lib/shortcuts/formatShortcutChordForDisplay";
import type { ShortcutCatalogEntry, ShortcutRegistration } from "@/lib/shortcuts/types";

export type OrderedShortcutRegistration = {
  registration: ShortcutRegistration;
  order: number;
};

/**
 * Builds a de-duplicated, sorted list of shortcuts for the help dialog.
 *
 * @param entries - Active registrations with monotonic `order` (newer is larger).
 * @returns Rows keyed by `id` (latest registration wins), sorted by `label`.
 */
export function buildShortcutCatalog(entries: ReadonlyArray<OrderedShortcutRegistration>): ShortcutCatalogEntry[] {
  const sortedByRecency = [...entries].sort(function sortByOrderDescending(a, b) {
    return b.order - a.order;
  });

  const seenIds = new Set<string>();
  const unique: OrderedShortcutRegistration[] = [];

  for (const entry of sortedByRecency) {
    if (seenIds.has(entry.registration.id)) {
      continue;
    }

    seenIds.add(entry.registration.id);
    unique.push(entry);
  }

  return unique
    .map(function mapRegistrationToCatalogRow(entry): ShortcutCatalogEntry {
      return {
        id: entry.registration.id,
        label: entry.registration.label ?? entry.registration.id,
        keysLabel: formatShortcutChordForDisplay(entry.registration.chord),
      };
    })
    .sort(function sortCatalogRowsByLabel(a, b) {
      return a.label.localeCompare(b.label);
    });
}
