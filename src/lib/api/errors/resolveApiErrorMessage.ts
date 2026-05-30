import type { ErrorCodeName } from "@/lib/api/errors/errorCodes";
import type { Dictionary } from "@/lib/lang/i18n";

import { DEFAULT_API_ERROR_MESSAGE } from "@/lib/api/errors/constants";
import { parseApiError } from "@/lib/api/errors/parseApiError";

const DTO_VALIDATION_SUMMARY_LIMIT = 5;

/**
 * Resolves a localized or API-provided message for a dictionary error code name.
 *
 * @param dict - Active locale dictionary.
 * @param errorCodeName - Catalog name for the numeric error code.
 * @returns Translated string when present in dict.apiErrors.
 */
function getDictMessageForErrorCodeName(
  dict: Dictionary,
  errorCodeName: ErrorCodeName,
): string | undefined {
  const apiErrors = dict.apiErrors;
  if (!apiErrors) {
    return undefined;
  }

  const message = apiErrors[errorCodeName];
  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  return undefined;
}

/**
 * Builds a user-facing message from an API error using hybrid i18n resolution.
 *
 * @param error - Caught value from an API call.
 * @param dict - Active locale dictionary.
 * @returns Display message for banners, toasts, and inline errors.
 */
export function resolveApiErrorMessage(error: unknown, dict: Dictionary): string {
  const apiError = parseApiError(error);

  if (apiError) {
    if (apiError.name) {
      const dictMessage = getDictMessageForErrorCodeName(dict, apiError.name);
      if (dictMessage) {
        return dictMessage;
      }
    }

    if (apiError.message.trim().length > 0) {
      return apiError.message;
    }
  }

  if (dict.somethingWentWrong) {
    return dict.somethingWentWrong;
  }

  return DEFAULT_API_ERROR_MESSAGE;
}

/**
 * Joins DTO field validation messages for form-level summaries.
 *
 * @param error - Caught value from an API call.
 * @param dict - Active locale dictionary.
 * @param limit - Maximum number of field messages to include.
 * @returns Combined message, or fallback from {@link resolveApiErrorMessage}.
 */
export function resolveDtoValidationSummary(
  error: unknown,
  dict: Dictionary,
  limit: number = DTO_VALIDATION_SUMMARY_LIMIT,
): string {
  const apiError = parseApiError(error);

  if (!apiError) {
    return resolveApiErrorMessage(error, dict);
  }

  const details = apiError.getDtoValidationDetails();
  const fieldMessages: string[] = [];

  for (const detail of details) {
    for (const fieldError of detail.errorMessages) {
      if (fieldError.errorMessage.trim().length > 0) {
        fieldMessages.push(fieldError.errorMessage);
      }
      if (fieldMessages.length >= limit) {
        break;
      }
    }
    if (fieldMessages.length >= limit) {
      break;
    }
  }

  if (fieldMessages.length > 0) {
    return fieldMessages.join(" ");
  }

  return resolveApiErrorMessage(error, dict);
}
