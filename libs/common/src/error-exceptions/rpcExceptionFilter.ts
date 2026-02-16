import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { CustomException } from './customException';
import { ErrorCode } from '../enums/errorCode.enum';

@Catch()
export class CustomRpcExceptionFilter implements RpcExceptionFilter {
    catch(exception: any, host: ArgumentsHost): Observable<any> {

        // If it is a customException, serialize it properly.
        if (exception instanceof CustomException) {
            const response = exception.getResponse() as any;
            return throwError(() => ({
                status: exception.getStatus(),
                errorCode: response.errorCode,
                message: response.message,
                errorDetails: response.errorDetails || []
            }));
        }

        // For other exceptions.
        return throwError(() => ({
            status: 500,
            errorCode: ErrorCode.UNKNOWN_ERROR,
            message: exception.message || 'Internal server error',
            errorDetails: []
        }));
    }
}