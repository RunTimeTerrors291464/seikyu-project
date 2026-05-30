import { resolveApiErrorMessage } from "@/lib/api/errors/resolveApiErrorMessage";
import type { Dictionary } from "@/lib/lang/i18n";

type SetErrorMessage = (message: string) => void;

/**
 * Sets a user-facing API error message, then rethrows the original error.
 *
 * @param error - Caught API error value.
 * @param dict - Active locale dictionary for message resolution.
 * @param setErrorMessage - State setter used by the caller UI.
 * @throws The original caught error.
 */
export function rethrowApiErrorWithMessage(
  error: unknown,
  dict: Dictionary,
  setErrorMessage: SetErrorMessage,
): never {
  setErrorMessage(resolveApiErrorMessage(error, dict));
  throw error;
}
