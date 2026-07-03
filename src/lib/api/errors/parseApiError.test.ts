import axios from "axios";
import { describe, expect, it } from "vitest";

import { ERROR_CODE } from "@/lib/api/errors/constants";
import {
  ApiError,
  isApiErrorBody,
  parseApiError,
} from "@/lib/api/errors/parseApiError";
import { resolveApiErrorMessage } from "@/lib/api/errors/resolveApiErrorMessage";
import type { Dictionary } from "@/lib/lang/i18n";
import en from "@/dictionaries/en.json";

const dict = en as Dictionary;

describe("isApiErrorBody", () => {
  it("accepts normalized API error bodies", () => {
    expect(
      isApiErrorBody({
        status: 404,
        errorCode: ERROR_CODE.USER_NOT_FOUND,
        message: "User not found",
        errorDetails: null,
      }),
    ).toBe(true);
  });

  it("rejects malformed bodies", () => {
    expect(isApiErrorBody(null)).toBe(false);
    expect(isApiErrorBody({ message: "missing fields" })).toBe(false);
  });
});

describe("parseApiError", () => {
  it("parses axios errors with normalized bodies", () => {
    const axiosError = new axios.AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config: { headers: {} } as never,
        data: {
          status: 401,
          errorCode: ERROR_CODE.INVALID_JWT_TOKEN,
          message: "Invalid token",
          errorDetails: null,
        },
      },
    );

    const parsed = parseApiError(axiosError);

    expect(parsed).toBeInstanceOf(ApiError);
    expect(parsed?.errorCode).toBe(ERROR_CODE.INVALID_JWT_TOKEN);
    expect(parsed?.name).toBe("INVALID_JWT_TOKEN");
    expect(parsed?.hasErrorCode(ERROR_CODE.INVALID_JWT_TOKEN)).toBe(true);
  });

  it("returns null for non-API axios errors", () => {
    const axiosError = new axios.AxiosError(
      "Network Error",
      "ERR_NETWORK",
      undefined,
      undefined,
      undefined,
    );

    expect(parseApiError(axiosError)).toBeNull();
  });
});

describe("resolveApiErrorMessage", () => {
  it("prefers dictionary messages for known error codes", () => {
    const error = new ApiError({
      status: 404,
      errorCode: ERROR_CODE.USER_NOT_FOUND,
      message: "User not found",
      errorDetails: null,
    });

    expect(resolveApiErrorMessage(error, dict)).toBe(dict.apiErrors.USER_NOT_FOUND);
  });

  it("falls back to API message when dictionary entry is missing", () => {
    const error = new ApiError({
      status: 500,
      errorCode: 49999,
      message: "Unexpected failure",
      errorDetails: null,
    });

    expect(resolveApiErrorMessage(error, dict)).toBe("Unexpected failure");
  });

  it("uses generic fallback for unknown errors", () => {
    expect(resolveApiErrorMessage(new Error("boom"), dict)).toBe(
      dict.somethingWentWrong,
    );
  });
});
