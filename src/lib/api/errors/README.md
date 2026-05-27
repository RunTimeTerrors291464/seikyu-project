# API error handling

The backend returns normalized error bodies via `CustomExceptionFilter`:

```json
{
  "status": 400,
  "errorCode": 5003,
  "message": "Invoice is not in draft status.",
  "errorDetails": []
}
```

## Catalog and codegen

- Source catalog: [`src/generated/api-error-codes.json`](../../generated/api-error-codes.json)
- Regenerate types: `npm run generate:errors`
- Generated: [`src/lib/api/generated/errorCodes.ts`](../generated/errorCodes.ts)

When the backend enum changes, copy the updated JSON from the API repo and run codegen.

## Usage

```ts
import { resolveApiErrorMessage, parseApiError, ERROR_CODE } from "@/lib/api/errors";

try {
  await someApiCall();
} catch (error: unknown) {
  setErrorMessage(resolveApiErrorMessage(error, dict));
}

const apiError = parseApiError(error);
if (apiError?.isErrorCode(ERROR_CODE.PRODUCT_NOT_FOUND)) {
  // ...
}
```

### Resolution order (`resolveApiErrorMessage`)

1. `dict.apiErrors[ERROR_CODE_NAME]` when defined
2. API `message` from the response body
3. `dict.somethingWentWrong`

Axios status text (e.g. `Request failed with status code 400`) is never shown for API failures.

### DTO validation (`8001`)

Use `resolveDtoValidationSummary(error, dict)` for form-level messages, or `apiError.getDtoValidationDetails()` for field-level UI.

## i18n

User-facing strings for fixed codes live under `apiErrors` in [`src/dictionaries/en.json`](../../../dictionaries/en.json) (and `vi`, `hu`). A generated English reference is written to [`src/dictionaries/generated/apiErrors.en.json`](../../../dictionaries/generated/apiErrors.en.json).

## Migration checklist

Replace:

```ts
error instanceof Error ? error.message : dict.somethingWentWrong
```

With:

```ts
resolveApiErrorMessage(error, dict)
```

Remaining catch sites (follow-up): selling/return/stock-adjustment invoice pages, product hooks, other invoice popups.
