import { HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Import services.
import { EncryptionService } from '../services/encryption.service';

// Import DTOs.
import { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

// Import custom exception.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly configService: ConfigService,
        private readonly encryptionService: EncryptionService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            passReqToCallback: false,
        });
    }

    async validate(payload: { data: string }): Promise<AccessTokenPayload> {
        // The payload from passport-jwt will be { data: encryptedPayload }.
        // Decrypt the encrypted payload.
        if (!payload?.data) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_JWT_TOKEN, 'Invalid token payload');
        }

        try {
            const decryptedPayload = this.encryptionService.decrypt(payload.data);
            const accessTokenPayload = JSON.parse(decryptedPayload) as AccessTokenPayload;

            // Verify the access token payload.
            if (!accessTokenPayload.id ||
                !accessTokenPayload.username ||
                !accessTokenPayload.roles ||
                !accessTokenPayload.refreshTokenId) {
                throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_JWT_PAYLOAD, 'Invalid JWT payload structure.');
            }

            return accessTokenPayload;
        } catch (error) {
            // If error is already a CustomException, rethrow it.
            if (error instanceof CustomException) throw error;
            throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_JWT_TOKEN, 'Failed to decrypt token payload');
        }
    }
}
