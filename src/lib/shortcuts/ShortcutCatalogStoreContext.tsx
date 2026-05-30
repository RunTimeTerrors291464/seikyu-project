"use client";

import type { ShortcutCatalogStore } from "@/lib/shortcuts/shortcutCatalogStore";
import { createContext } from "react";

export const ShortcutCatalogStoreContext = createContext<ShortcutCatalogStore | null>(null);
