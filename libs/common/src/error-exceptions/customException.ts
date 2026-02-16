import { HttpException } from "@nestjs/common";

export class CustomException extends HttpException {
    constructor(
        status: number,
        errorCode: number,
        message?: string,
        errorDetails?: Record<string, any>
    ) {
        // Set up a default message and error details.
        const defaultMessage = message ? message : "Something went wrong, please try again later!";
        const defaultErrorDetails = errorDetails ? errorDetails : {};

        super({
            status,
            errorCode,
            message: defaultMessage,
            errorDetails: defaultErrorDetails,
        }, status);
    }
}