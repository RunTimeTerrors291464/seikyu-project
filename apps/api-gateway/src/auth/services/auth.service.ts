import { HttpStatus, Inject, Injectable } from '@nestjs/common';

// Import config service.
import { ConfigService } from '@nestjs/config';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import bycrypt.
import * as bcrypt from 'bcrypt';

// Import uuid.
import { v4 as uuidv4 } from 'uuid';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import JWT service.
import { JwtService } from '@nestjs/jwt';

// Import repositories.
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';

// Import services.
import { AccessTokenService } from './accessToken.service';

// Import DTOs.
import type { RefreshTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';
import { UserResponseWithPasswordDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';
import { LoginRequestDto, LogoutRequestDto } from '@app/common/dtos/api-gateway/auth/authRequest.dto';
import { AuthResponseDto } from '@app/common/dtos/api-gateway/auth/authResponse.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly accessTokenService: AccessTokenService,
    ) { }

    // Login a user.
    @HandleServiceError(ErrorCode.LOGIN_SERVICE)
    async login(dto: LoginRequestDto): Promise<AuthResponseDto> {

        // Check if the user exists.
        let user: UserResponseWithPasswordDto;
        try {
            user = await firstValueFrom(
                this.platformService.send({ cmd: 'users.getUserByUsername' }, { username: dto.username, withPassword: true })
            );
        } catch (error) {
            if (error.status && error.errorCode) {
                throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            }
            else {
                throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
            }
        }

        // Create user response DTO without password.
        const { password, ...userResponseDto } = user;

        // Check if the user is active.
        if (!user.isActive) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.USER_ALREADY_DEACTIVATED, 'The user is not active.');

        // Check if the user has too many refresh tokens.
        const hasTooManyRefreshTokens: boolean = await this.refreshTokenRepository.checkUserHasTooManyRefreshTokens(user.id);
        if (hasTooManyRefreshTokens === true) throw new CustomException(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REFRESH_TOKENS, 'The user has too many refresh tokens.');

        // Check if the password is correct.
        const isPasswordCorrect: boolean = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordCorrect) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.USERNAME_OR_PASSWORD_INCORRECT, 'The username or password is incorrect.');

        // Generate a JWT token.
        const refreshTokenPayload: RefreshTokenPayload = {
            id: uuidv4(),
            userId: user.id,
        };
        const refreshToken: string = this.jwtService.sign(refreshTokenPayload, {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: '14d'
        });

        // Generate access token with encrypted payload using AccessTokenService.
        const accessToken: string = await this.accessTokenService.signAccessToken(
            user.id,
            user.username,
            user.roles,
            refreshTokenPayload.id
        );

        // Store the refresh token.
        const expiresAt: Date = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days.
        await this.refreshTokenRepository.storeRefreshToken(refreshTokenPayload.id, refreshTokenPayload.userId, refreshToken, expiresAt);

        return {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: userResponseDto
        };
    }

    // Logout a user.
    @HandleServiceError(ErrorCode.LOGOUT_SERVICE)
    async logout(logoutDto: LogoutRequestDto): Promise<boolean> {

        // Validate the refresh token.
        const refreshTokenEntity = await this.refreshTokenRepository.validateRefreshToken(logoutDto.refreshToken);
        if (!refreshTokenEntity) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is invalid.');

        // Remove the refresh token from the database.
        await this.refreshTokenRepository.removeRefreshToken(refreshTokenEntity);

        return true;
    }

}