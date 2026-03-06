import { Controller, Query, Get, Body, Inject, HttpCode, HttpStatus, UseGuards, Patch } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard, CurrentUser, Roles } from '../../auth/guards';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import DTOs.
import { UserChangePasswordRequestDto } from '@app/common/dtos/platform/users/userChangePasswordRequest.dto';
import { UserResponseDto, GetListOfUsersForSearchResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';
import type { AccessTokenPayload } from '@app/common/dtos/api-gateway/auth/jwtPayload.interface';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Platform] Users Operations: These APIs allow users to manage their own account.')
@Controller({
    path: 'api/v1/users',
    version: '1'
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy,
    ) { }

    // Get user information.
    // GET /api/v1/users
    @Get()
    @ApiOperation({ summary: '[USER] Get user information' })
    @ApiResponse({ status: 200, description: 'The user information has been found successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async getUserInformation(@CurrentUser() user: AccessTokenPayload): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'users.getUserById' }, { id: user.id, withPassword: false })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Users change their password.
    // PATCH /api/v1/users/change-password
    @Patch('change-password')
    @ApiOperation({ summary: '[USER] Change user password' })
    @ApiBody({ type: UserChangePasswordRequestDto })
    @ApiResponse({ status: 200, description: 'The user password has been changed successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async changeUserPassword(@Body() dto: UserChangePasswordRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'users.userChangePassword' }, { userId: user.id, dto })
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }

    // Search method to get users' username and id.
    // GET /api/v1/users/search
    @Get('search')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Search users by username' })
    @ApiResponse({ status: 200, description: 'The users have been found successfully.', type: GetListOfUsersForSearchResponseDto })
    @HttpCode(HttpStatus.OK)
    async searchUsers(@Query('search') search: string): Promise<GetListOfUsersForSearchResponseDto> {
        try {
            const result: GetListOfUsersForSearchResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'users.searchUsers' }, search)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            else throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}