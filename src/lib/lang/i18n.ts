import en from "@/dictionaries/en.json";
import vi from "@/dictionaries/vi.json";

export type Dictionary = typeof en;

export type Lang = "en" | "vi";

const dictionaries: Record<Lang, Dictionary> = {
  en,
  vi
};

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

  return lang === "vi" ? "vi" : "en";
}