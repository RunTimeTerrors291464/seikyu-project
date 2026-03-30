import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Import access token payload interface.
import { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

export const CurrentUser = createParamDecorator(
    (data: keyof AccessTokenPayload | undefined, ctx: ExecutionContext): AccessTokenPayload | any => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as AccessTokenPayload;

        return data ? user?.[data] : user;
    }
);
