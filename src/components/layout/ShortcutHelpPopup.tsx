"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import { useDict, useUiLang } from "@/lib/lang/DictProvider";
import { resolveShortcutCatalogLabel } from "@/lib/shortcuts/resolveShortcutCatalogLabel";
import useShortcutsCatalog from "@/lib/shortcuts/useShortcutsCatalog";
import type { ShortcutCatalogEntry } from "@/lib/shortcuts/types";
import { Keyboard } from "lucide-react";
import { useMemo } from "react";

type ShortcutHelpPopupProps = {
  open: boolean;
  onClose: () => void;
};

type TranslatedShortcutRow = ShortcutCatalogEntry & {
  displayLabel: string;
};

/**
 * Modal listing all registered shortcuts (labels and formatted keys).
 *
 * @param props - Visibility and dismiss handler.
 * @param props.open - When true, the dialog is rendered.
 * @param props.onClose - Called for backdrop click, Escape, or after user finishes reading.
 * @returns The popup tree or null when `open` is false.
 */
export default function ShortcutHelpPopup({ open, onClose }: ShortcutHelpPopupProps) {
  const dict = useDict();
  const uiLang = useUiLang();
  const rawRows = useShortcutsCatalog();

  const rows = useMemo(
    function buildTranslatedShortcutRows(): TranslatedShortcutRow[] {
      const mapped: TranslatedShortcutRow[] = rawRows.map(function mapShortcutRow(
        row: ShortcutCatalogEntry,
      ): TranslatedShortcutRow {
        return {
          ...row,
          displayLabel: resolveShortcutCatalogLabel(dict, row.id, row.label),
        };
      });

      mapped.sort(function sortShortcutsByDisplayLabel(left, right): number {
        return left.displayLabel.localeCompare(right.displayLabel, uiLang);
      });

      return mapped;
    },
    [dict, rawRows, uiLang],
  );

  return (
    <Popup open={open} onClose={onClose}>
      <div
        className="flex w-[min(100%,28rem)] max-h-[min(85vh,32rem)] flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-help-title"
        aria-describedby="shortcut-help-subtitle"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <Keyboard className="h-5 w-5 text-muted" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <h2 id="shortcut-help-title" className="text-sm font-semibold text-text">
              {dict.shortcutsHelpTitle}
            </h2>
            <p id="shortcut-help-subtitle" className="text-xs text-muted">
              {dict.shortcutsHelpSubtitle}
            </p>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-3">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium">{dict.shortcutsHelpActionColumn}</th>
                <th className="py-2 font-medium">{dict.shortcutsHelpKeysColumn}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(function renderShortcutRow(row) {
                return (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 align-top text-text">{row.displayLabel}</td>
                    <td className="py-2 align-top">
                      <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-text">
                        {row.keysLabel}
                      </kbd>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Popup>
  );
}
