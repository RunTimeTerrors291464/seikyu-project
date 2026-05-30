import en from "@/dictionaries/en.json";
import hu from "@/dictionaries/hu.json";
import vi from "@/dictionaries/vi.json";

export type Dictionary = typeof en;

/** Top-level dictionary keys whose values are display strings (excludes nested objects like `apiErrors`). */
export type DictionaryLabelKey = {
  [Key in keyof Dictionary]: Dictionary[Key] extends string ? Key : never;
}[keyof Dictionary];

export type Lang = "en" | "vi" | "hu";

const dictionaries: Record<Lang, Dictionary> = {
  en,
  hu,
  vi
};

export const PRINT_LANG_COOKIE = "printLang" as const;

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

/**
 * Reads `lang` from `document.cookie` (client only). During SSR this returns `"en"`, which does not
 * match the real cookie—use `useUiLang()` from `DictProvider` in rendered UI instead.
 */
export function getLang(): Lang {
  if (typeof document === "undefined") return "en";

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("lang="));

  const lang = cookie?.split("=")[1];

  if (lang === "vi") return "vi";
  if (lang === "hu") return "hu";
  return "en";
}

/**
 * Client-only. Reads the optional default print locale cookie set from Settings.
 * When missing or invalid, returns `null` so callers can fall back (e.g. to UI language).
 */
export function getPrintLangCookie(): Lang | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${PRINT_LANG_COOKIE}=`;
  const row = document.cookie.split("; ").find(function matchPrintLang(cookieRow) {
    return cookieRow.startsWith(prefix);
  });
  const raw = row?.slice(prefix.length);

  if (raw === "vi" || raw === "hu" || raw === "en") {
    return raw;
  }
  return null;
}