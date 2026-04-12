"use client";

import Popup from "@/components/layout/BlurPopupWrapper";
import Button from "@/components/ui/Buttons";
import { useDict } from "@/lib/lang/DictProvider";
import { getLang } from "@/lib/lang/i18n";
import {
  applyLanguage,
  PreferenceChip,
  ThemeLightDarkToggle,
} from "@/lib/preferences/appPreferenceUi";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

type AppSettingsPopupProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Modal for theme (next-themes) and UI language (`lang` cookie + `router.refresh`).
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

  const activeLang = getLang();

  return (
    <Popup open={open} onClose={onClose} backdropBlur={false}>
      <div className="w-[min(100%,22rem)]">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
            <Settings className="h-3.5 w-3.5 text-muted" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">{dict.settings}</h2>
            <p className="text-xs text-muted">{dict.appearanceAndLanguage}</p>
          </div>
        </div>

        <div className="space-y-5 px-4 py-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">{dict.themeLabel}</p>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeLightDarkToggle
                labelSwitchToLight={dict.switchToLightTheme}
                labelSwitchToDark={dict.switchToDarkTheme}
              />
            </div>
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
