import { ValidationError } from 'class-validator';

// Import error codes.
import { ErrorCode } from '../enums/errorCode.enum';

// Map class-validator constraint names to their corresponding error codes.
const CONSTRAINT_ERROR_CODE_MAP: Record<string, ErrorCode> = {
    isNotEmpty: ErrorCode.IS_NOT_EMPTY_ERROR,
    isString: ErrorCode.IS_STRING_ERROR,
    isNumber: ErrorCode.IS_NUMBER_ERROR,
    isBoolean: ErrorCode.IS_BOOLEAN_ERROR,
    isArray: ErrorCode.IS_ARRAY_ERROR,
    isObject: ErrorCode.IS_OBJECT_ERROR,
    isDate: ErrorCode.IS_DATE_ERROR,
    isEmail: ErrorCode.IS_EMAIL_ERROR,
    isUrl: ErrorCode.IS_URL_ERROR,
    isIP: ErrorCode.IS_IP_ERROR,
    isInt: ErrorCode.IS_INT_ERROR,
    isEnum: ErrorCode.IS_ENUM_ERROR,
    minLength: ErrorCode.MIN_LENGTH_ERROR,
    maxLength: ErrorCode.MAX_LENGTH_ERROR,
    min: ErrorCode.MIN_ERROR,
    max: ErrorCode.MAX_ERROR,
    matches: ErrorCode.MATCHES_ERROR,
    isStrongPassword: ErrorCode.IS_STRONG_PASSWORD_ERROR,
    whitelistValidation: ErrorCode.WHITELISTED_ERROR,
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

// Format raw class-validator ValidationError[] into a structured per-field error shape.
export function formatValidationErrors(errors: ValidationError[]): FormattedValidationError[] {
    return errors.map((error) => ({
        errorObject: error.property,
        errorMessages: Object.entries(error.constraints || {}).map(([constraint, message]) => ({
            errorCode: CONSTRAINT_ERROR_CODE_MAP[constraint] ?? ErrorCode.UNKNOWN_CONSTRAINT_ERROR,
            errorMessage: message,
        })),
    }));
}
