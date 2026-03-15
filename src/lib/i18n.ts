import en from "@/dictionaries/en.json";
import vi from "@/dictionaries/vi.json";


export type Dictionary = typeof en & typeof vi;

const dictionaries: Record<"en" | "vi", Dictionary> = {
  en: en as Dictionary,
  vi: vi as Dictionary,
};

export function getDictionary(lang: "en" | "vi"): Dictionary {
  return dictionaries[lang];
}