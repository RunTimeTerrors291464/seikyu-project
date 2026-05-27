import axios from "axios";

import {
  errorCodeByNumber,
  type ErrorCodeName,
} from "@/lib/api/errors/errorCodes";

import { DTO_VALIDATION_ERROR_CODE } from "@/lib/api/errors/constants";
import type {
  ApiErrorBody,
  DtoFieldErrorMessage,
  DtoValidationDetail,
} from "@/lib/api/errors/types";

/**
 * Type guard for the normalized API error response body.
 *
 * @param data - Parsed JSON from an error response.
 * @returns True when the body matches {@link ApiErrorBody}.
 */
export function isApiErrorBody(data: unknown): data is ApiErrorBody {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    typeof candidate.status === "number" &&
    typeof candidate.errorCode === "number" &&
    typeof candidate.message === "string" &&
    "errorDetails" in candidate
  );
}

function isDtoFieldErrorMessage(value: unknown): value is DtoFieldErrorMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.errorCode === "number" &&
    typeof candidate.errorMessage === "string"
  );
}

function isDtoValidationDetail(value: unknown): value is DtoValidationDetail {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.errorObject !== "string") {
    return false;
  }

  if (!Array.isArray(candidate.errorMessages)) {
    return false;
  }

  return candidate.errorMessages.every(isDtoFieldErrorMessage);
}

/**
 * Parsed API error with catalog metadata and DTO validation helpers.
 */
export class ApiError {
  readonly httpStatus: number;
  readonly errorCode: number;
  readonly message: string;
  readonly errorDetails: unknown;
  readonly name: ErrorCodeName | undefined;

  /**
   * @param body - Normalized error body from the API.
   */
  constructor(body: ApiErrorBody) {
    this.httpStatus = body.status;
    this.errorCode = body.errorCode;
    this.message = body.message;
    this.errorDetails = body.errorDetails;
    this.name = errorCodeByNumber[body.errorCode];
  }

  /**
   * @param code - Numeric error code to compare.
   * @returns True when this error matches the given code.
   */
  isErrorCode(code: number): boolean {
    return this.errorCode === code;
  }

  /**
   * @param codes - One or more numeric error codes.
   * @returns True when this error matches any of the given codes.
   */
  hasErrorCode(...codes: number[]): boolean {
    return codes.includes(this.errorCode);
  }

  /**
   * @returns DTO validation field details when errorCode is 8001 and details are an array.
   */
  getDtoValidationDetails(): DtoValidationDetail[] {
    if (this.errorCode !== DTO_VALIDATION_ERROR_CODE) {
      return [];
    }

    if (!Array.isArray(this.errorDetails)) {
      return [];
    }

    return this.errorDetails.filter(isDtoValidationDetail);
  }
}

/**
 * Extracts a structured {@link ApiError} from an Axios failure or raw body.
 *
 * @param error - Caught value from an API call.
 * @returns Parsed error, or null when the response is not a normalized API error.
 */
export function parseApiError(error: unknown): ApiError | null {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (isApiErrorBody(data)) {
      return new ApiError(data);
    }
    return null;
  }

  if (isApiErrorBody(error)) {
    return new ApiError(error);
  }

  return null;
}
