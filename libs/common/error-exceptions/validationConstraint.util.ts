import { ValidationError } from 'class-validator';

// Import error codes.
import { ErrorCode } from '../enums/errorCode.enum';

// Map class-validator `ValidationError.constraints` keys → ErrorCode (same order / meaning as errorCode.enum.ts DTO block).
// Keys must match class-validator constraint names (see node_modules/class-validator decorators, e.g. IS_UUID → 'isUuid').
// DTO_VALIDATION_ERROR (8001) is applied at HTTP layer for the whole validation response, not per-constraint.
// UNKNOWN_CONSTRAINT_ERROR (8199) is used in collectFormattedErrors when a key is missing from this map.
// --- DTO Validation Error (matches ErrorCode enum 8100–8125) ---
const CONSTRAINT_ERROR_CODE_MAP: Record<string, ErrorCode> = {
    isNotEmpty: ErrorCode.IS_NOT_EMPTY_ERROR, // 8100
    isString: ErrorCode.IS_STRING_ERROR, // 8101
    isNumber: ErrorCode.IS_NUMBER_ERROR, // 8102
    isBoolean: ErrorCode.IS_BOOLEAN_ERROR, // 8103
    isArray: ErrorCode.IS_ARRAY_ERROR, // 8104
    isObject: ErrorCode.IS_OBJECT_ERROR, // 8105
    isDate: ErrorCode.IS_DATE_ERROR, // 8106
    isEmail: ErrorCode.IS_EMAIL_ERROR, // 8107
    isUrl: ErrorCode.IS_URL_ERROR, // 8108
    isIP: ErrorCode.IS_IP_ERROR, // 8109
    isInt: ErrorCode.IS_INT_ERROR, // 8110
    isEnum: ErrorCode.IS_ENUM_ERROR, // 8111
    minLength: ErrorCode.MIN_LENGTH_ERROR, // 8112 — property less than minimum length
    maxLength: ErrorCode.MAX_LENGTH_ERROR, // 8113 — property greater than maximum length
    min: ErrorCode.MIN_ERROR, // 8114 — property less than minimum value
    max: ErrorCode.MAX_ERROR, // 8115 — property greater than maximum value
    matches: ErrorCode.MATCHES_ERROR, // 8116 — property does not match regex
    isStrongPassword: ErrorCode.IS_STRONG_PASSWORD_ERROR, // 8117
    whitelistValidation: ErrorCode.WHITELISTED_ERROR, // 8118 — not allowed by DTO whitelist
    isUuid: ErrorCode.IS_UUID_ERROR, // 8119 — @IsUUID / @IsUUID(..., { each: true })
    isDateString: ErrorCode.IS_DATE_STRING_ERROR, // 8120 — @IsDateString
    isIn: ErrorCode.IS_IN_ERROR, // 8121 — @IsIn
    nestedValidation: ErrorCode.NESTED_VALIDATION_ERROR, // 8122 — @ValidateNested invalid object/array
    arrayMaxSize: ErrorCode.ARRAY_MAX_SIZE_ERROR, // 8123 — @ArrayMaxSize
    arrayUnique: ErrorCode.ARRAY_UNIQUE_ERROR, // 8124 — @ArrayUnique
    InvoiceDateRange: ErrorCode.INVOICE_DATE_RANGE_INVALID, // 8125 — @Validate(InvoiceDateRangeConstraint)
};

// Shape of each error message entry inside a field's error list.
export interface ValidationErrorMessage {
    errorCode: number;
    errorMessage: string;
}

// Shape of a single field's validation error block.
export interface FormattedValidationError {
    errorObject: string;
    errorMessages: ValidationErrorMessage[];
}

function collectFormattedErrors(error: ValidationError, out: FormattedValidationError[]): void {
    const messages = Object.entries(error.constraints || {}).map(([constraint, message]) => ({
        errorCode: CONSTRAINT_ERROR_CODE_MAP[constraint] ?? ErrorCode.UNKNOWN_CONSTRAINT_ERROR,
        errorMessage: message,
    }));
    if (messages.length > 0) {
        out.push({ errorObject: error.property, errorMessages: messages });
    }
    for (const child of error.children ?? []) {
        collectFormattedErrors(child, out);
    }
}

// Format raw class-validator ValidationError[] into a structured per-field error shape.
// Nested @ValidateNested failures live under children; without recursion only the parent
// property appears with empty errorMessages. errorObject is the leaf property name only.
export function formatValidationErrors(errors: ValidationError[]): FormattedValidationError[] {
    const out: FormattedValidationError[] = [];
    for (const error of errors) {
        collectFormattedErrors(error, out);
    }
    return out;
}
