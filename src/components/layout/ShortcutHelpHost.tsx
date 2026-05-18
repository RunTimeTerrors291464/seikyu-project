"use client";

import ShortcutHelpPopup from "@/components/layout/ShortcutHelpPopup";
import { useDict } from "@/lib/lang/DictProvider";
import useShortcut from "@/lib/shortcuts/useShortcut";
import { useCallback, useState } from "react";

const OPEN_HELP_CHORD = { code: "Slash", mod: true } as const;

/**
 * Registers the global "keyboard shortcuts" chord and renders the help popup.
 *
 * @returns React node containing the help popup (inert when closed).
 */
export default function ShortcutHelpHost() {
  const dict = useDict();
  const [open, setOpen] = useState(false);

  const toggleHelp = useCallback(function toggleShortcutHelp(): void {
    setOpen(function toggle(previous) {
      return !previous;
    });
  }, []);

  const closeHelp = useCallback(function closeShortcutHelp(): void {
    setOpen(false);
  }, []);

  useShortcut({
    id: "shortcuts.open-help",
    chord: OPEN_HELP_CHORD,
    label: dict.shortcutLabelOpenHelp,
    handler: toggleHelp,
    allowInEditable: true,
    priority: 1000,
  });

  return <ShortcutHelpPopup open={open} onClose={closeHelp} />;
}
