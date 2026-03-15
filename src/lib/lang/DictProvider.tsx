"use client";

import type { Dictionary } from "@/lib/lang/i18n";
import { createContext, useContext } from "react";

const DictContext = createContext<Dictionary | null>(null);

export function DictProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <DictContext.Provider value={dict}>
      {children}
    </DictContext.Provider>
  );
}

export function useDict() {
  const ctx = useContext(DictContext);

  if (!ctx) {
    throw new Error("useDict must be used inside DictProvider");
  }

  return ctx;
}