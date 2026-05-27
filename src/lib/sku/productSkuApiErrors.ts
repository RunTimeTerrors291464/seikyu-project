import { ERROR_CODE, parseApiError } from "@/lib/api/errors";

/**
 * @param error - Caught error from {@link getProductBySku}.
 * @returns True when the API responded with PRODUCT_NOT_FOUND (4002) or HTTP 404.
 */
export function isProductSkuNotFoundError(error: unknown): boolean {
  const apiError = parseApiError(error);
  if (apiError?.isErrorCode(ERROR_CODE.PRODUCT_NOT_FOUND)) {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

/**
 * @param error - Caught error from a product SKU API call.
 * @returns True when the normalized body indicates product not found (4002).
 */
export function isProductSkuNotFoundApiError(error: unknown): boolean {
  const apiError = parseApiError(error);
  return apiError?.isErrorCode(ERROR_CODE.PRODUCT_NOT_FOUND) ?? false;
}
