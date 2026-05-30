"use client";

import { useDict } from "@/lib/lang/DictProvider";
import useShortcut from "@/lib/shortcuts/useShortcut";
import {
  focusDeepestUniversalSearchTarget,
  UNIVERSAL_FOCUS_SEARCH_SHORTCUT_CHORD,
  UNIVERSAL_FOCUS_SEARCH_SHORTCUT_ID,
} from "@/lib/shortcuts/universalShortcut";
import { useCallback } from "react";

/**
 * Registers global universal shortcuts that are not page-specific (for example focus search).
 *
 * @returns Inert fragment mounting shortcut registrations only.
 */
export default function UniversalShortcutHost(): null {
  const dict = useDict();

  const handleFocusSearchShortcut = useCallback(function handleFocusSearchShortcut(
    event: KeyboardEvent,
  ): void {
    void event;
    focusDeepestUniversalSearchTarget();
  }, []);

  useShortcut({
    id: UNIVERSAL_FOCUS_SEARCH_SHORTCUT_ID,
    chord: UNIVERSAL_FOCUS_SEARCH_SHORTCUT_CHORD,
    label: dict.shortcutLabelUniversalFocusSearch,
    handler: handleFocusSearchShortcut,
    allowInEditable: true,
    priority: 500,
  });

  return null;
}
