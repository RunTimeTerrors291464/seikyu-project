import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard } from '../guards/jwt.guard';

// Import decorators.
import { Public } from '../decorators/public.decorator';

// Import services.
import { AuthService } from '../services/auth.service';
import { AccessTokenService } from '../services/accessToken.service';

// Import DTOs.
import { GetAccessTokenRequestDto, LoginRequestDto, LogoutRequestDto } from '@libs/common/dtos/auth/crudAuthRequest.dto';
import { AccessTokenResponseDto, AuthResponseDto } from '@libs/common/dtos/auth/crudAuthResponse.dto';

@ApiTags('[Auth] Authentication APIs: These APIs are for user authentication.')
@Controller({
    path: 'api/v2/auth',
    version: '2'
})
@UseGuards(JwtAuthGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly accessTokenService: AccessTokenService,
    ) { }

    // Login a user.
    // POST /api/v2/auth/login
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
    // POST /api/v2/auth/logout
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
    // POST /api/v2/auth/refresh-token
    @Post('refresh-token')
    @Public()
    @ApiOperation({ summary: '[PUBLIC] Refresh access token using refresh token' })
    @ApiBody({ type: GetAccessTokenRequestDto })
    @ApiResponse({ status: 200, description: 'A new access token has been generated successfully.', type: AccessTokenResponseDto })
    @HttpCode(HttpStatus.OK)
    async signNewAccessToken(@Body() dto: GetAccessTokenRequestDto): Promise<AccessTokenResponseDto> {
        return await this.accessTokenService.signNewAccessToken(dto);
    }
}
