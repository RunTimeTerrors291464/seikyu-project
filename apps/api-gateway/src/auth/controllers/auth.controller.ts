import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard } from '../guards';

// Import decorators.
import { Public, CurrentUser } from '../guards';

// Import services.
import { AuthService } from '../services/auth.service';
import { AccessTokenService } from '../services/accessToken.service';

// Import DTOs.
import { AccessTokenRequestDto, LoginRequestDto, LogoutRequestDto } from '@app/common/dtos/api-gateway/auth/authRequest.dto';
import { AccessTokenResponseDto, AuthResponseDto } from '@app/common/dtos/api-gateway/auth/authResponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Auth] Authentication APIs: These APIs are for user authentication.')
@Controller({
    path: 'api/v1/auth',
    version: '1'
})
@UseGuards(JwtAuthGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly accessTokenService: AccessTokenService,
    ) { }

    // Login a user.
    // POST /api/v1/auth/login
    @Post('login')
    @Public()
    @ApiOperation({ summary: '[PUBLIC] Login a user' })
    @ApiBody({ type: LoginRequestDto })
    @ApiResponse({ status: 200, description: 'The user has been logged in successfully.', type: AuthResponseDto })
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
        return await this.authService.login(dto);
    }

    // Logout a user.
    // POST /api/v1/auth/logout
    @Post('logout')
    @ApiBearerAuth()
    @ApiOperation({ summary: '[USER] Logout a user' })
    @ApiBody({ type: LogoutRequestDto })
    @ApiResponse({ status: 204, description: 'The user has been logged out successfully.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Body() dto: LogoutRequestDto): Promise<void> {
        await this.authService.logout(dto);
    }

    // Refresh access token using refresh token.
    // POST /api/v1/auth/refresh-token
    @Post('refresh-token')
    @Public()
    @ApiOperation({ summary: '[PUBLIC] Refresh access token using refresh token' })
    @ApiBody({ type: AccessTokenRequestDto })
    @ApiResponse({ status: 200, description: 'A new access token has been generated successfully.', type: AccessTokenResponseDto })
    @HttpCode(HttpStatus.OK)
    async signNewAccessToken(@Body() dto: AccessTokenRequestDto): Promise<AccessTokenResponseDto> {
        return await this.accessTokenService.signNewAccessToken(dto);
    }
}
