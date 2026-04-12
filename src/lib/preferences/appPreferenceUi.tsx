"use client";

import type { Lang } from "@/lib/lang/i18n";
import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore, type ReactNode } from "react";

export type PreferenceChipSize = "default" | "compact";

type PreferenceChipProps = {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
  size?: PreferenceChipSize;
  /** Exposed on the button when the visible label is abbreviated (e.g. `EN`). */
  ariaLabel?: string;
};

const SIZE_STYLES: Record<PreferenceChipSize, string> = {
  default: "gap-2 px-3 py-2 text-sm",
  compact: "gap-1.5 px-2 py-1.5 text-xs",
};

/**
 * Selectable pill matching app settings (border, primary accent when active).
 *
 * @param props - Visual size, selection state, and click handler.
 * @param props.size - `compact` for toolbar-style controls (e.g. login header).
 * @param props.selected - Whether this option is active.
 * @param props.children - Label content.
 * @param props.onClick - Invoked when the chip is activated.
 * @param props.ariaLabel - Optional accessible name when children are abbreviated.
 * @returns A `button` element.
 */
export function PreferenceChip({
  selected,
  children,
  onClick,
  size = "default",
  ariaLabel,
}: PreferenceChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={clsx(
        "inline-flex items-center rounded-md border text-left font-medium transition-colors",
        SIZE_STYLES[size],
        selected
          ? "border-primary bg-primary/10 text-text"
          : "border-border bg-bg text-muted hover:bg-hover hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

type ThemeLightDarkToggleProps = {
  size?: PreferenceChipSize;
  /** Accessible name when the UI is dark (control switches to light). */
  labelSwitchToLight: string;
  /** Accessible name when the UI is light (control switches to dark). */
  labelSwitchToDark: string;
};

const TOGGLE_BOX: Record<PreferenceChipSize, string> = {
  default: "h-10 w-10 p-2",
  compact: "h-8 w-8 p-1.5",
};

const TOGGLE_ICON: Record<PreferenceChipSize, string> = {
  default: "h-5 w-5",
  compact: "h-3.5 w-3.5",
};

/**
 * Becomes true only after client hydration so server HTML matches the first client pass.
 *
 * @returns `false` during SSR and hydration, then `true` on the client.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    function subscribeToNothing() {
      return function cleanup() {};
    },
    function getClientSnapshot() {
      return true;
    },
    function getServerSnapshot() {
      return false;
    },
  );
}

/**
 * Single control that flips between light and dark themes using sun / moon icons.
 * Uses `resolvedTheme` so “system” preference still shows the correct icon.
 *
 * @param props - Size and aria strings for each direction.
 * @param props.labelSwitchToLight - Announced when showing the sun (dark UI active).
 * @param props.labelSwitchToDark - Announced when showing the moon (light UI active).
 * @returns Icon button wired to `next-themes` `setTheme("light" | "dark")`.
 */
export function ThemeLightDarkToggle({
  size = "default",
  labelSwitchToLight,
  labelSwitchToDark,
}: ThemeLightDarkToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div
        aria-hidden
        className={clsx(
          "inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-bg",
          TOGGLE_BOX[size],
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
      }}
      aria-label={isDark ? labelSwitchToLight : labelSwitchToDark}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-bg text-text transition-colors",
        "hover:bg-hover",
        TOGGLE_BOX[size],
      )}
    >
      {isDark ? (
        <Sun
          aria-hidden
          strokeWidth={2.25}
          className={TOGGLE_ICON[size]}
        />
      ) : (
        <Moon
          aria-hidden
          strokeWidth={2.25}
          className={TOGGLE_ICON[size]}
        />
      )}
    </button>
  );
}

/**
 * Persists UI language and refreshes server components so `DictProvider` matches.
 *
 * @param lang - Target locale (`en` or `vi`).
 * @param routerRefresh - Next.js `router.refresh` from `useRouter()`.
 */
export function applyLanguage(
  lang: Lang,
  routerRefresh: () => void,
): void {
  document.cookie = `lang=${lang}; path=/; SameSite=Lax`;
  routerRefresh();
}
