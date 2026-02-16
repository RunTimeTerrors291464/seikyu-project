import { CustomException } from '../error-exceptions/customException';
import { ErrorCode } from '../enums/errorCode.enum';
import { HttpStatus } from '@nestjs/common';

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
                // If the error is a known custom exception, throw it.
                if (error instanceof CustomException) throw error;

                // Else, throw a new custom exception.
                throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, errorCode, error.message);
            }
        };
        return descriptor;
    };
}