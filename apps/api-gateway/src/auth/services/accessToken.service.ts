import { HttpStatus, Inject, Injectable } from '@nestjs/common';

// Import config service.
import { ConfigService } from '@nestjs/config';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import JWT service.
import { JwtService } from '@nestjs/jwt';

// Import repositories.
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';

// Import services.
import { EncryptionService } from './encryption.service';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import DTOs.
import { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { AccessTokenRequestDto } from '@app/common/dtos/api-gateway/auth/authRequest.dto';
import { AccessTokenResponseDto } from '@app/common/dtos/api-gateway/auth/authResponse.dto';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

@Injectable()
export class AccessTokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly encryptionService: EncryptionService,
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy,
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
        // Verify the JWT token
        const decoded = this.jwtService.verify<{ data: string }>(token, {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });

        // Decrypt the payload
        const decryptedPayload = this.encryptionService.decrypt(decoded.data);

        // Parse and return the payload
        return JSON.parse(decryptedPayload) as AccessTokenPayload;
    }

    // --- APIs ---
    // Sign a new access token.
    @HandleServiceError(ErrorCode.NEW_ACCESS_TOKEN_SERVICE)
    async signNewAccessToken(accessTokenRequestDto: AccessTokenRequestDto): Promise<AccessTokenResponseDto> {

        // Check the rate limit of the refresh token.
        const isRateLimit = await this.refreshTokenRepository.checkRateLimit(accessTokenRequestDto.refreshToken);
        if (isRateLimit) throw new CustomException(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED, 'The rate limit of the refresh token has been exceeded.');

        // Verify the refresh token.
        const refreshToken = await this.refreshTokenRepository.validateRefreshToken(accessTokenRequestDto.refreshToken);
        if (!refreshToken) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is invalid.');

        // Get the payload from the refresh token.
        const payload = this.jwtService.verify(refreshToken.refreshToken, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        });

        // Get the user information from the database.
        let user: UserResponseDto;
        try {
            user = await firstValueFrom(
                this.platformService.send({ cmd: 'users.getUserById' }, { id: payload.userId, withPassword: false })
            );
        } catch (error) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }

        // Generate a new access token using signAccessToken.
        const accessToken: string = await this.signAccessToken(
            user.id,
            user.username,
            user.roles,
            refreshToken.id
        );

        // Set the rate limit of the refresh token.
        await this.refreshTokenRepository.setRateLimit(accessTokenRequestDto.refreshToken);

        return { accessToken };
    }

    // Validate a refresh token.
    @HandleServiceError(ErrorCode.VALIDATE_REFRESH_TOKEN_SERVICE)
    async validateRefreshToken(refreshToken: string): Promise<boolean> {
        const refreshTokenEntity = await this.refreshTokenRepository.validateRefreshToken(refreshToken);
        if (!refreshTokenEntity) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is revoked or expired.');

        return true;
    }

    // Validate a refresh token id.
    @HandleServiceError(ErrorCode.VALIDATE_REFRESH_TOKEN_BY_ID_SERVICE)
    async validateRefreshTokenById(refreshTokenId: string): Promise<boolean> {
        const isValid = await this.refreshTokenRepository.validateRefreshTokenById(refreshTokenId);
        if (!isValid) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is revoked or expired.');

        return true;
    }

    // Revoke all refresh tokens of a user.
    @HandleServiceError(ErrorCode.REVOKE_ALL_REFRESH_TOKENS_SERVICE)
    async revokeAllRefreshTokens(userId: string): Promise<boolean> {
        return await this.refreshTokenRepository.removeAllRefreshTokens(userId);
    }
}
