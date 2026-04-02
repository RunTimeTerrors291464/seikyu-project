import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';

// Import config service.
import { ConfigService } from '@nestjs/config';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

// Import JWT service.
import { JwtService } from '@nestjs/jwt';

// Import entities.
import { EntityManager } from 'typeorm';
import { RefreshTokenEntity } from '../entities/refreshToken.entity';

// Import repositories.
import { AuthRepository } from '../repositories/auth.repository';

// Import services.
import { EncryptionService } from './encryption.service';
import { UsersService } from '@src/users/services/users.service';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import DTOs.
import { AccessTokenPayload, RefreshTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';
import { GetAccessTokenRequestDto } from '@libs/common/dtos/auth/crudAuthRequest.dto';
import { AccessTokenResponseDto } from '@libs/common/dtos/auth/crudAuthResponse.dto';
import { UserResponseDto } from '@libs/common/dtos/users/crudUsersResponse.dto';

@Injectable()
export class AccessTokenService {
    constructor(
        private readonly authRepository: AuthRepository,

        @Inject(forwardRef(() => UsersService)) private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly encryptionService: EncryptionService,
    ) { }

    // --- DRY methods ---
    async signAccessToken(id: string, username: string, roles: Role[], refreshTokenId: string): Promise<string> {

        const accessTokenPayload: AccessTokenPayload = {
            id: id,
            username: username,
            roles: roles,
            refreshTokenId: refreshTokenId,
        };

        // Encrypt the payload before signing to prevent reading.
        const payloadString: string = JSON.stringify(accessTokenPayload);
        const encryptedPayload: string = this.encryptionService.encrypt(payloadString);

        // Sign the encrypted payload.
        return this.jwtService.sign({ data: encryptedPayload }, {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            expiresIn: '30m'
        });
    }

    async verifyAndDecryptAccessToken(token: string): Promise<AccessTokenPayload> {
        const decoded = this.jwtService.verify<{ data: string }>(token, {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });

        // Decrypt the payload.
        const decryptedPayload = this.encryptionService.decrypt(decoded.data);

        // Parse and return the payload.
        return JSON.parse(decryptedPayload) as AccessTokenPayload;
    }

    // --- APIs ---
    // Sign a new access token.
    @HandleServiceError(ErrorCode.NEW_ACCESS_TOKEN_SERVICE)
    async signNewAccessToken(accessTokenRequestDto: GetAccessTokenRequestDto): Promise<AccessTokenResponseDto> {

        // Check the rate limit of the refresh token.
        const isRateLimit: boolean = await this.authRepository.checkRateLimit(accessTokenRequestDto.refreshToken);
        if (isRateLimit) throw new CustomException(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED, 'The rate limit of the refresh token has been exceeded.');

        // Verify the refresh token.
        const refreshToken: RefreshTokenEntity | null = await this.authRepository.validateRefreshToken(accessTokenRequestDto.refreshToken);
        if (!refreshToken) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is invalid.');

        // Get the payload from the refresh token.
        const payload: RefreshTokenPayload = this.jwtService.verify(refreshToken.refreshToken, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });

        // Get the user information from the database.
        const user: UserResponseDto = await this.usersService.getUserInformationById(payload.userId, false);

        // Generate a new access token using signAccessToken.
        const accessToken: string = await this.signAccessToken(
            user.id,
            user.username,
            user.roles,
            refreshToken.id
        );

        // Set the rate limit of the refresh token.
        await this.authRepository.setRateLimit(accessTokenRequestDto.refreshToken);

        return { accessToken };
    }

    // Validate a refresh token.
    @HandleServiceError(ErrorCode.VALIDATE_REFRESH_TOKEN_SERVICE)
    async validateRefreshToken(refreshToken: string): Promise<boolean> {
        const refreshTokenEntity = await this.authRepository.validateRefreshToken(refreshToken);
        if (!refreshTokenEntity) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is revoked or expired.');

        return true;
    }

    // Validate a refresh token id.
    @HandleServiceError(ErrorCode.VALIDATE_REFRESH_TOKEN_BY_ID_SERVICE)
    async validateRefreshTokenById(refreshTokenId: string): Promise<boolean> {
        const isValid = await this.authRepository.validateRefreshTokenById(refreshTokenId);
        if (!isValid) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is revoked or expired.');

        return true;
    }

    // Revoke all refresh tokens of a user.
    @HandleServiceError(ErrorCode.REVOKE_ALL_REFRESH_TOKENS_SERVICE)
    async revokeAllRefreshTokens(userId: string, manager: EntityManager): Promise<boolean> {
        return await this.authRepository.removeAllRefreshTokens(userId, manager);
    }
}
