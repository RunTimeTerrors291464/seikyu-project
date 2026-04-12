"use client";

import type { Dictionary, Lang } from "@/lib/lang/i18n";
import { createContext, useContext, useMemo } from "react";

type LocaleContextValue = {
  dict: Dictionary;
  /** Matches the `lang` cookie used for SSR `dict` and `<html lang>`. */
  lang: Lang;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Supplies dictionary strings and the active UI language from the root layout (cookie on the server).
 *
 * @param props.dict - Dictionary for `props.lang`.
 * @param props.lang - Locale aligned with SSR; avoids reading `document.cookie` during render.
 * @param props.children - App tree.
 * @returns Context provider for `useDict` / `useUiLang`.
 */
export function DictProvider({
  dict,
  lang,
  children,
}: {
  dict: Dictionary;
  lang: Lang;
  children: React.ReactNode;
}) {
  const value = useMemo(
    function buildLocaleValue(): LocaleContextValue {
      return { dict, lang };
    },
    [dict, lang],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useDict(): Dictionary {
  const ctx = useContext(LocaleContext);

  if (!ctx) {
    throw new Error("useDict must be used inside DictProvider");
  }

  return ctx.dict;
}

/**
 * Active UI language from the root layout (same source as SSR dictionary).
 *
 * @returns `en` or `vi`, matching the `lang` cookie on the initial server render.
 */
export function useUiLang(): Lang {
  const ctx = useContext(LocaleContext);

  if (!ctx) {
    throw new Error("useUiLang must be used inside DictProvider");
  }

  return ctx.lang;
}