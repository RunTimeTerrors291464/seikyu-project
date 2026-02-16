import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

export const CurrentUser = createParamDecorator(
    (data: keyof AccessTokenPayload | undefined, ctx: ExecutionContext): AccessTokenPayload | any => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as AccessTokenPayload;

        return data ? user?.[data] : user;
    }
);
