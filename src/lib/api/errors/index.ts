export { DEFAULT_API_ERROR_MESSAGE, DTO_VALIDATION_ERROR_CODE, ERROR_CODE } from "@/lib/api/errors/constants";
export { ApiError, isApiErrorBody, parseApiError } from "@/lib/api/errors/parseApiError";
export {
  resolveApiErrorMessage,
  resolveDtoValidationSummary,
} from "@/lib/api/errors/resolveApiErrorMessage";
export type {
  ApiErrorBody,
  DtoFieldErrorMessage,
  DtoValidationDetail,
} from "@/lib/api/errors/types";
