import type { Dictionary } from "@/lib/lang/i18n";

export type UnitWordKey = keyof Dictionary["unitWords"];

/** Matches standalone words or digits glued to a unit word (e.g. "6db", "10m", "pack"). */
const UNIT_TOKEN_PATTERN = /(\d+)([\p{L}]+)|([\p{L}]+)/gu;

/**
 * Translates unit vocabulary inside a stored unit name.
 * Supports English names ("pack/6 pieces") and Hungarian tokens ("6db/cs", "10m").
 * Numbers and separators (/, spaces) are preserved.
 *
 * @param unitName - Unit name from the API.
 * @param dict - Active locale dictionary.
 * @returns Localized unit label; unchanged when input is empty or no mapping exists.
 */
export function translateUnitName(unitName: string, dict: Dictionary): string {
  if (!unitName.trim()) {
    return unitName;
  }

  const unitWords = dict.unitWords;
  if (!unitWords) {
    return unitName;
  }

  return unitName.replace(
    UNIT_TOKEN_PATTERN,
    (match, gluedDigits: string | undefined, gluedLetters: string | undefined, standaloneLetters: string | undefined) => {
      const letters = gluedLetters ?? standaloneLetters ?? match;
      const key = letters.toLowerCase() as UnitWordKey;
      const translated = unitWords[key];
      const word = typeof translated === "string" ? translated : letters;

      if (gluedDigits) {
        return `${gluedDigits}${word}`;
      }

      return word;
    },
  );
}
