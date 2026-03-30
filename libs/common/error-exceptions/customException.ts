import { HttpException } from '@nestjs/common';

export class CustomException extends HttpException {
    constructor(
        status: number,
        errorCode: number,
        message?: string,
        errorDetails?: Record<string, any>
    ) {
        const defaultMessage = message ?? 'Something went wrong, please try again later!';
        const defaultErrorDetails = errorDetails ?? {};

        super(
            {
                status,
                errorCode,
                message: defaultMessage,
                errorDetails: defaultErrorDetails,
            },
            status
        );
    }
}
