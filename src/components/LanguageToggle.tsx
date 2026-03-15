"use client";

import { useRouter } from "next/navigation";

export default function LanguageToggle() {
  const router = useRouter();

  function changeLang(lang: string) {
    document.cookie = `lang=${lang}; path=/`;
    router.refresh();
  }

  return (
    <div className="flex gap-2">

      <button
        onClick={() => changeLang("en")}
        className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
      >
        EN
      </button>

      <button
        onClick={() => changeLang("vi")}
        className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
      >
        VI
      </button>
    </div>
  );
}