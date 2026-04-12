"use client";

import { ThemeLightDarkToggle } from "@/lib/preferences/appPreferenceUi";
import { useDict } from "@/lib/lang/DictProvider";

/**
 * Login-header control: toggles light/dark with sun and moon icons (matches app settings).
 *
 * @returns A single icon button wired to `next-themes`.
 */
export default function ThemeToggle() {
  const dict = useDict();

  return (
    <ThemeLightDarkToggle
      size="compact"
      labelSwitchToLight={dict.switchToLightTheme}
      labelSwitchToDark={dict.switchToDarkTheme}
    />
  );
}
