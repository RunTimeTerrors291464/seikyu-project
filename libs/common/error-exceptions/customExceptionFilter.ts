// Import NestJS common.
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

// Import Express response.
import { Response } from 'express';

// Import custom exception and error codes.
import { CustomException } from './customException';
import { ErrorCode } from '../enums/errorCode.enum';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let statusCode: number;

        let errorPayload: {
            status: number;
            errorCode: number;
            message: string;
            errorDetails: any;
        };

        // --- Case 1: CustomException ---
        // Thrown manually via CustomException. The response shape is already pre-formatted.
        if (exception instanceof CustomException) {
            statusCode = exception.getStatus();
            errorPayload = exception.getResponse() as typeof errorPayload;

        // --- Case 2: HttpException ---
        } else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const errorResponse = exception.getResponse() as any;

            // --- Case 2a: DTO validation error (class-validator via ValidationPipe) ---
            // Detected by: status 400, error "Bad Request", and message is an array of strings.
            const isClassValidatorError =
                errorResponse.statusCode === 400 &&
                errorResponse.error === 'Bad Request' &&
                Array.isArray(errorResponse.message);

            if (isClassValidatorError) {
                errorPayload = {
                    status: statusCode,
                    errorCode: ErrorCode.DTO_VALIDATION_ERROR,
                    message: '[ERROR] DTO Validation Error',
                    errorDetails: errorResponse.message,
                };

            // --- Case 2b: Generic HTTP exception (e.g. UnauthorizedException, ForbiddenException) ---
            } else {
                errorPayload = {
                    status: statusCode,
                    errorCode: ErrorCode.HTTP_EXCEPTION,
                    message: '[ERROR] HTTP Exception Error',
                    errorDetails: Array.isArray(errorResponse.message)
                        ? errorResponse.message
                        : [errorResponse.message],
                };
            }

        // --- Case 3: Unknown / unexpected error ---
        // Catches anything that is not an HttpException (e.g. runtime errors, unhandled throws).
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errorPayload = {
                status: statusCode,
                errorCode: ErrorCode.UNKNOWN_ERROR,
                message: '[ERROR] Undefined or Unknown Error',
                errorDetails: [],
            };
        }

        response.status(statusCode).json(errorPayload);
    }
}
