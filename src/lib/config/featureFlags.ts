export const DEFAULT_CASHIER_INVOICE_HIDE = true;

/**
 * Parses a boolean environment variable while preserving an explicit fallback.
 * Empty or unrecognized values use the fallback instead of silently disabling a feature.
 */
export function parseBooleanEnv(
  value: string | undefined,
  fallback: boolean,
): boolean {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

/**
 * Whether cashier users should only see the continuous new-sale workflow.
 * Defaults to enabled when CASHIER_INVOICE_HIDE is missing or invalid.
 */
export function isCashierInvoiceHideEnabled(): boolean {
  return parseBooleanEnv(
    process.env.CASHIER_INVOICE_HIDE,
    DEFAULT_CASHIER_INVOICE_HIDE,
  );
}
