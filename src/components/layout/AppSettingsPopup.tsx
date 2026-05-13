"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { useDict, useUiLang } from "@/lib/lang/DictProvider";
import { getPrintLangCookie, type Lang } from "@/lib/lang/i18n";
import {
  PreferenceChip,
  applyLanguage,
  applyPrintLanguage,
  useHydrated,
} from "@/lib/preferences/appPreferenceUi";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type AppSettingsPopupProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Modal for theme (next-themes), UI language (`lang` cookie + `router.refresh`), and default print language (`printLang` cookie).
 *
 * @param props - Visibility and dismiss handler.
 * @param props.open - When true, the dialog is rendered.
 * @param props.onClose - Called for backdrop click, Escape, or Close.
 * @returns The popup tree or null when `open` is false.
 */
export default function AppSettingsPopup({
  open,
  onClose,
}: AppSettingsPopupProps) {
  const dict = useDict();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const storedTheme = theme ?? "system";
  const themePreference =
    storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "system";

  const activeLang = useUiLang();
  const [activePrintLang, setActivePrintLang] = useState<Lang>(activeLang);

  useEffect(
    function syncPrintLangFromCookieWhenOpen(): void {
      if (open) {
        setActivePrintLang(getPrintLangCookie() ?? activeLang);
      }
    },
    [open, activeLang],
  );

  return (
    <Popup open={open} onClose={onClose} backdropBlur={false}>
      <div className="w-[min(100%,22rem)]">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <Settings className="h-5 w-5 text-muted" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">{dict.settings}</h2>
            <p className="text-xs text-muted">{dict.appearanceAndLanguage}</p>
          </div>
        </div>

        <div className="space-y-5 px-4 py-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">{dict.themeLabel}</p>
            {!hydrated ? (
              <div className="flex flex-wrap gap-2" aria-hidden>
                <div className="h-10 w-14 rounded-md border border-border bg-bg" />
                <div className="h-10 w-14 rounded-md border border-border bg-bg" />
                <div className="h-10 w-28 rounded-md border border-border bg-bg" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <PreferenceChip
                  selected={themePreference === "light"}
                  onClick={function setLightTheme(): void {
                    setTheme("light");
                  }}
                >
                  {dict.themeLight}
                </PreferenceChip>
                <PreferenceChip
                  selected={themePreference === "dark"}
                  onClick={function setDarkTheme(): void {
                    setTheme("dark");
                  }}
                >
                  {dict.themeDark}
                </PreferenceChip>
                <PreferenceChip
                  selected={themePreference === "system"}
                  onClick={function setSystemTheme(): void {
                    setTheme("system");
                  }}
                >
                  {dict.themeSystem}
                </PreferenceChip>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">{dict.languageLabel}</p>
            <div className="flex flex-wrap gap-2">
              <PreferenceChip
                selected={activeLang === "en"}
                onClick={() => {
                  applyLanguage("en", router.refresh);
                }}
              >
                {dict.langEnglish}
              </PreferenceChip>
              <PreferenceChip
                selected={activeLang === "vi"}
                onClick={() => {
                  applyLanguage("vi", router.refresh);
                }}
              >
                {dict.langVietnamese}
              </PreferenceChip>
              <PreferenceChip
                selected={activeLang === "hu"}
                onClick={() => {
                  applyLanguage("hu", router.refresh);
                }}
              >
                {dict.langHungarian}
              </PreferenceChip>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">{dict.defaultPrintLanguageLabel}</p>
            <div className="flex flex-wrap gap-2">
              <PreferenceChip
                selected={activePrintLang === "en"}
                onClick={function setDefaultPrintEnglish(): void {
                  applyPrintLanguage("en");
                  setActivePrintLang("en");
                }}
              >
                {dict.langEnglish}
              </PreferenceChip>
              <PreferenceChip
                selected={activePrintLang === "vi"}
                onClick={function setDefaultPrintVietnamese(): void {
                  applyPrintLanguage("vi");
                  setActivePrintLang("vi");
                }}
              >
                {dict.langVietnamese}
              </PreferenceChip>
              <PreferenceChip
                selected={activePrintLang === "hu"}
                onClick={function setDefaultPrintHungarian(): void {
                  applyPrintLanguage("hu");
                  setActivePrintLang("hu");
                }}
              >
                {dict.langHungarian}
              </PreferenceChip>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button accent="neutral" onClick={onClose}>
            {dict.closeDialog}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
