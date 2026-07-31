"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface FeatureFlags {
  cashierInvoiceHide: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  cashierInvoiceHide: true,
};

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

export function FeatureFlagsProvider({
  children,
  cashierInvoiceHide,
}: {
  children: ReactNode;
  cashierInvoiceHide: boolean;
}) {
  return (
    <FeatureFlagsContext.Provider value={{ cashierInvoiceHide }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlags {
  return useContext(FeatureFlagsContext);
}
