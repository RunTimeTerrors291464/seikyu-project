import { Controller, Post, Put, Get, Patch, Body, Param, Inject, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../../auth/guards';

// Import services.
import { AccessTokenService } from '../../auth/services/accessToken.service';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import DTOs.
import {
    CreateNewUserRequestDto,
    EditUserRequestDto,
    GetListOfUsersRequestDto,
} from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import { ForgotPasswordRequestDto } from '@app/common/dtos/platform/users/forgotPasswordRequest.dto';
import { UserResponseDto, GetListOfUsersResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Platform] Admin Operations: These APIs are for users management.')
@Controller({
    path: 'api/v1/admin',
    version: '1'
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
    constructor(
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy,
        private readonly accessTokenService: AccessTokenService,
    ) { }

    // Create a new user.
    // POST /api/v1/admin/users
    @Post('users')
    @ApiOperation({ summary: '[ADMIN] Create a new user' })
    @ApiBody({ type: CreateNewUserRequestDto })
    @ApiResponse({ status: 201, description: 'A user has been created successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createNewUser(@Body() dto: CreateNewUserRequestDto): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'admin.createNewUser' }, dto)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Edit user information.
    // PATCH /api/v1/admin/users
    @Patch('users')
    @ApiOperation({ summary: '[ADMIN] Edit user information' })
    @ApiBody({ type: EditUserRequestDto })
    @ApiResponse({ status: 200, description: 'The user information has been updated successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async editUserInformation(@Body() dto: EditUserRequestDto): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'admin.editUserInformation' }, dto)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a user by id.
    // GET /api/v1/admin/users/:id
    @Get('users/:id')
    @ApiOperation({ summary: '[ADMIN] Get a user by id' })
    @ApiParam({ name: 'id', type: String, description: 'ID of the user', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiResponse({ status: 200, description: 'The user has been found successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send(
                    { cmd: 'users.getUserById' },
                    { id, withPassword: false }
                )
            );
            return result;
        }
        catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Get a list of users.
    // GET /api/v1/admin/users
    @Get('users')
    @ApiOperation({ summary: '[ADMIN] Get a list of users' })
    @ApiResponse({ status: 200, description: 'The list of users has been found successfully.', type: GetListOfUsersResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfUsers(@Query() dto: GetListOfUsersRequestDto): Promise<GetListOfUsersResponseDto> {
        try {
            const result: GetListOfUsersResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'users.getListOfUsers' }, dto)
            );
            return result;
        }
        catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Deactivate a user.
    // PATCH /api/v1/admin/users/deactivate/:id
    @Patch('users/deactivate/:id')
    @ApiOperation({ summary: '[ADMIN] Deactivate a user' })
    @ApiParam({ name: 'id', type: String, description: 'ID of the user', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiResponse({ status: 200, description: 'The user has been deactivated successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async deactivateUser(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'admin.deactivateUser' }, { id, actionUserId: user.id })
            );

            // Revoke all refresh tokens of the user.
            await this.accessTokenService.revokeAllRefreshTokens(id);
            
            return result;
        }
        catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Activate a user.
    // PATCH /api/v1/admin/users/activate/:id
    @Patch('users/activate/:id')
    @ApiOperation({ summary: '[ADMIN] Activate a user' })
    @ApiParam({ name: 'id', type: String, description: 'ID of the user', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiResponse({ status: 200, description: 'The user has been activated successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async activateUser(@Param('id') id: string): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'admin.activateUser' }, id)
            );
            return result;
        }
        catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Admin reset password for a user.
    // POST /api/v1/admin/users/reset-password
    @Post('users/reset-password')
    @ApiOperation({ summary: '[ADMIN] Admin reset password for a user' })
    @ApiBody({ type: ForgotPasswordRequestDto })
    @ApiResponse({ status: 200, description: 'The password has been reset successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ForgotPasswordRequestDto): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'admin.forgotPassword' }, dto)
            );
            return result;
        }
        catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}