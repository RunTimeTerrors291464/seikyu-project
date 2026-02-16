import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { CustomException } from "./customException";
import { Response } from 'express';

// Imports error codes.
import { ErrorCode } from "../enums/errorCode.enum";

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Set up the variables for the error response.
        let statusCode: number;
        let errorPayload: any;

        // If the exception is a CustomException, return the custom exception response.
        if (exception instanceof CustomException) {
            statusCode = exception.getStatus();
            errorPayload = exception.getResponse();
        }

        // If the exception is a HttpException, return the http exception response.
        /*  errorPayload:
        status: number,
        errorCode: number,
        message?: string,
        errorDetails?: Record<string, any>
        */
        else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();

            const errorResponse = exception.getResponse() as any;

            // Check if the error is from class-validator.
            const isClassValidatorError = errorResponse.statusCode === 400 && errorResponse.error === 'Bad Request' && Array.isArray(errorResponse.message);
            if (isClassValidatorError) {
                errorPayload = {
                    status: statusCode,
                    errorCode: ErrorCode.DTO_VALIDATION_ERROR,
                    message: '[Error] DTO validation error',
                    errorDetails: errorResponse.message
                };
            }
            else {
                errorPayload = {
                    status: statusCode,
                    errorCode: ErrorCode.HTTP_EXCEPTION,
                    message: '[Error] HTTP exception error',
                    errorDetails: Array.isArray(errorResponse.message) ? errorResponse.message : [errorResponse.message]
                };
            }
        }

        // Handle any other type of exception.
        else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errorPayload = {
                status: statusCode,
                errorCode: ErrorCode.UNKNOWN_ERROR,
                message: '[Error] Undefined or unknown error',
                errorDetails: []
            };
        }

        response.status(statusCode).json(errorPayload);
    }
}
