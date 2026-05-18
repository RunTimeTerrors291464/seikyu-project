"use client";

import ShortcutHelpHost from "@/components/layout/ShortcutHelpHost";
import UniversalShortcutHost from "@/components/layout/UniversalShortcutHost";
import type { OrderedShortcutRegistration } from "@/lib/shortcuts/buildShortcutCatalog";
import { ShortcutCatalogStoreContext } from "@/lib/shortcuts/ShortcutCatalogStoreContext";
import { ShortcutRegisterContext } from "@/lib/shortcuts/ShortcutRegisterContext";
import { isEditableKeyboardTarget } from "@/lib/shortcuts/isEditableKeyboardTarget";
import { matchesShortcutChord } from "@/lib/shortcuts/matchesShortcutChord";
import { createShortcutRegistryModel } from "@/lib/shortcuts/shortcutRegistryModel";
import type { ShortcutRegisterFn, ShortcutRegistration } from "@/lib/shortcuts/types";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Resolves whether a matched shortcut should stop the browser default and propagation.
 *
 * @param registration - Shortcut registration from the registry.
 * @returns True when the event should be consumed.
 */
function shouldStopKeyboardEvent(registration: ShortcutRegistration): boolean {
  if (registration.stopEvent === false) {
    return false;
  }

  return true;
}

/**
 * Provides a global keyboard shortcut registry for the React subtree.
 *
 * @param props.children - Application subtree that may call `useShortcut`.
 * @returns React element wrapping `children` with shortcut context.
 */
export default function ShortcutProvider({ children }: { children: React.ReactNode }) {
  const [model] = useState(function createShortcutRegistryModelOnce() {
    return createShortcutRegistryModel();
  });
  const { catalogStore, addRegistration, removeRegistration, getDispatchEntries } = model;
  const orderRef = useRef<number>(0);

  const registerShortcut = useCallback<ShortcutRegisterFn>(function registerShortcut(
    registration: ShortcutRegistration,
  ): () => void {
    const order = orderRef.current;
    orderRef.current += 1;
    const entry: OrderedShortcutRegistration = { registration, order };
    addRegistration(entry);

    return function unregisterShortcut(): void {
      removeRegistration(entry);
    };
  }, [addRegistration, removeRegistration]);

  useEffect(
    function installGlobalShortcutListener(): () => void {
      function handleKeyDown(event: KeyboardEvent): void {
        if (event.defaultPrevented) {
          return;
        }

        const entries = [...getDispatchEntries()].sort(function sortRegistrations(a, b) {
          const priorityA = a.registration.priority ?? 0;
          const priorityB = b.registration.priority ?? 0;
          if (priorityB !== priorityA) {
            return priorityB - priorityA;
          }

          return b.order - a.order;
        });

        for (const entry of entries) {
          const registration = entry.registration;
          if (!matchesShortcutChord(event, registration.chord)) {
            continue;
          }

          const allowInEditable = registration.allowInEditable === true;
          if (!allowInEditable && isEditableKeyboardTarget(event.target)) {
            continue;
          }

          registration.handler(event);

          if (shouldStopKeyboardEvent(registration)) {
            event.preventDefault();
            event.stopPropagation();
          }

          return;
        }
      }

      window.addEventListener("keydown", handleKeyDown, { capture: true });

      return function removeGlobalShortcutListener(): void {
        window.removeEventListener("keydown", handleKeyDown, { capture: true });
      };
    },
    [getDispatchEntries],
  );

  return (
    <ShortcutRegisterContext.Provider value={registerShortcut}>
      <ShortcutCatalogStoreContext.Provider value={catalogStore}>
        {children}
        <ShortcutHelpHost />
        <UniversalShortcutHost />
      </ShortcutCatalogStoreContext.Provider>
    </ShortcutRegisterContext.Provider>
  );
}
