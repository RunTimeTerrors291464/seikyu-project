"use client";

import { PreferenceChip, applyLanguage } from "@/lib/preferences/appPreferenceUi";
import { useDict } from "@/lib/lang/DictProvider";
import { getLang } from "@/lib/lang/i18n";
import { useRouter } from "next/navigation";

/**
 * Compact language switcher for the login header; matches settings popup behavior and styling.
 *
 * @returns Chips that set the `lang` cookie and refresh the app.
 */
export default function LanguageToggle() {
  const dict = useDict();
  const router = useRouter();
  const activeLang = getLang();

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label={dict.languageLabel}
    >
      <PreferenceChip
        size="compact"
        selected={activeLang === "en"}
        ariaLabel={dict.langEnglish}
        onClick={() => {
          applyLanguage("en", router.refresh);
        }}
      >
        EN
      </PreferenceChip>
      <PreferenceChip
        size="compact"
        selected={activeLang === "vi"}
        ariaLabel={dict.langVietnamese}
        onClick={() => {
          applyLanguage("vi", router.refresh);
        }}
      >
        VI
      </PreferenceChip>
    </div>
  );
}
