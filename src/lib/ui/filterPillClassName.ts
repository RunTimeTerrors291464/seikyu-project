import { ACCENT_STYLES, type Accent } from "@/components/types/ui";

/**
 * Class names for pill-style filter buttons: the "all" option uses solid text/bg; other options use accent strips with opacity.
 *
 * @param optionValue - This chip's value (must equal `allValue` for the neutral "all" chip).
 * @param currentFilter - Currently selected filter value.
 * @param allValue - Sentinel for the "all" option.
 * @param accentForOption - Maps a non-all option to a theme accent.
 * @returns Tailwind `className` string for `rounded-full border ...`.
 */
export function getFilterPillClassName<T>(
  optionValue: T,
  currentFilter: T,
  allValue: T,
  accentForOption: (value: T) => Accent,
): string {
  if (optionValue === allValue) {
    return currentFilter === optionValue
      ? "border-text bg-text text-bg"
      : "border-border bg-card text-muted";
  }

  const accent = accentForOption(optionValue);
  return `${ACCENT_STYLES[accent]} ${currentFilter === optionValue ? "opacity-100" : "opacity-70"}`;
}
