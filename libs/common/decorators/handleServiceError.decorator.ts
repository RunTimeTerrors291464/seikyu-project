// Import NestJS common.
import { HttpStatus } from '@nestjs/common';

// Import TypeORM errors.
import { OptimisticLockVersionMismatchError, QueryFailedError } from 'typeorm';

// Import custom exception and error codes.
import { CustomException } from '../error-exceptions/customException';
import { ErrorCode } from '../enums/errorCode.enum';

export function HandleServiceError(errorCode: ErrorCode) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                return await originalMethod.apply(this, args);

            } catch (error) {

                // --- Case 1: CustomException ---
                // Thrown manually via CustomException. Already pre-formatted, re-throw as-is.
                if (error instanceof CustomException) throw error;

                // --- Case 2: OptimisticLockVersionMismatchError ---
                // Thrown by TypeORM when a version mismatch is detected (race condition).
                if (error instanceof OptimisticLockVersionMismatchError) {
                    throw new CustomException(
                        HttpStatus.CONFLICT,
                        ErrorCode.RACE_CONDITION_ERROR,
                        '[ERROR] Race condition error occurred. Please try again later.',
                        { message: error.message }
                    );
                }

                // --- Case 3: QueryFailedError ---
                // Thrown by TypeORM when a DB query fails (e.g. constraint violations, syntax errors).
                if (error instanceof QueryFailedError) {
                    const dbError = error as any;
                    const pgCode: string = dbError?.code ?? '';

                    // --- Case 3a: DB connection / timeout errors ---
                    // PG codes: 08* = connection errors, 57P01 = admin shutdown, 57014 = query cancelled.
                    const isConnectionError =
                        pgCode.startsWith('08') ||
                        pgCode === '57P01' ||
                        pgCode === '57014' ||
                        (error as any)?.message?.includes('ECONNRESET') ||
                        (error as any)?.message?.includes('ETIMEDOUT');

                    if (isConnectionError) {
                        throw new CustomException(
                            HttpStatus.SERVICE_UNAVAILABLE,
                            ErrorCode.DB_CONNECTION_ERROR,
                            '[ERROR] Database connection error. Please try again later.',
                            { message: error.message }
                        );
                    }

                    // --- Case 3b: Generic DB query error ---
                    // Covers constraint violations, syntax errors, and other query-level failures.
                    throw new CustomException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        ErrorCode.DB_QUERY_ERROR,
                        '[ERROR] Database query error.',
                        { pgCode, message: error.message }
                    );
                }

                // --- Case 4: Unknown / unexpected error ---
                // Catches anything not covered above (e.g. runtime errors, unhandled throws).
                throw new CustomException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    errorCode,
                    '[ERROR] ' + (error?.message ?? 'Undefined or Unknown Error'),
                );
            }
        };

        return descriptor;
    };
}
