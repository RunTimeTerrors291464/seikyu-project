import { HttpStatus, Injectable } from '@nestjs/common';

// Import config service.
import { ConfigService } from '@nestjs/config';

// Import bycrypt.
import * as bcrypt from 'bcrypt';

// Import crypto.
import * as crypto from 'crypto';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

// Import JWT service.
import { JwtService } from '@nestjs/jwt';

// Import TypeORM.
import { DataSource } from 'typeorm';

// Import repositories.
import { AuthRepository } from '../repositories/auth.repository';
import { UsersService } from '@src/users/services/users.service';

// Import services.
import { AccessTokenService } from './accessToken.service';

// Import DTOs.
import type { RefreshTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';
import { UserResponseWithPasswordDto } from '@libs/common/dtos/users/crudUsersResponse.dto';
import { LoginRequestDto, LogoutRequestDto } from '@libs/common/dtos/auth/crudAuthRequest.dto';
import { AuthResponseDto } from '@libs/common/dtos/auth/crudAuthResponse.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,

        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly accessTokenService: AccessTokenService,
        private readonly dataSource: DataSource,
    ) { }

    // Login a user.
    @HandleServiceError(ErrorCode.LOGIN_SERVICE)
    async login(dto: LoginRequestDto): Promise<AuthResponseDto> {

        // Check if the user exists.
        const user: UserResponseWithPasswordDto = await this.usersService.getUserByUsername(dto.username, true);

        // Create user response DTO without password.
        const { password, ...userResponseDto } = user;

        // Check if the user is active.
        if (!user.isActive) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.USER_ALREADY_DEACTIVATED, 'The user is not active.');

        // Check if the user has too many refresh tokens.
        const hasTooManyRefreshTokens: boolean = await this.authRepository.checkUserHasTooManyRefreshTokens(user.id);
        if (hasTooManyRefreshTokens === true) throw new CustomException(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REFRESH_TOKENS, 'The user has too many refresh tokens.');

        // Check if the password is correct.
        const isPasswordCorrect: boolean = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordCorrect) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.USERNAME_OR_PASSWORD_INCORRECT, 'The username or password is incorrect.');

        // Generate a JWT token.
        const refreshTokenPayload: RefreshTokenPayload = {
            id: crypto.randomUUID(),
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
        await this.dataSource.transaction(async (transactionManager) => {
            await this.authRepository.storeRefreshToken(
                refreshTokenPayload.id,
                refreshTokenPayload.userId,
                refreshToken,
                expiresAt,
                transactionManager,
            );
        });

        return {
            accessToken,
            refreshToken,
            user: userResponseDto,
        };
    }

    // Logout a user.
    @HandleServiceError(ErrorCode.LOGOUT_SERVICE)
    async logout(logoutDto: LogoutRequestDto): Promise<boolean> {

        // Validate the refresh token.
        const refreshTokenEntity = await this.authRepository.validateRefreshToken(logoutDto.refreshToken);
        if (!refreshTokenEntity) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The refresh token is invalid.');

        // Remove the refresh token from the database.
        await this.authRepository.removeRefreshToken(refreshTokenEntity);

        return true;
    }

}