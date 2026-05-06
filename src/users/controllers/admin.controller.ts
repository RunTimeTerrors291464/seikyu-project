import { Controller, Post, Get, Patch, Body, Param, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RateLimitGuard } from '@src/auth/guards/rateLimit.guard';

// Import decorators.
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '@libs/common/decorators/getUserInformation.decorator';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import services.
import { UsersService } from '../services/users.service';
import { AccessTokenService } from '../../auth/services/accessToken.service';

// Import DTOs.
import {
    CreateNewUserRequestDto,
    EditUserRequestDto,
    ForgotPasswordRequestDto,
    GetListOfUsersRequestDto,
} from '@libs/common/dtos/users/crudUsersRequest.dto';
import {
    UserResponseDto,
    GetListOfUsersResponseDto,
} from '@libs/common/dtos/users/crudUsersResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Users] Admin Operations: These APIs are for users management.')
@Controller({
    path: 'api/v2/admin',
    version: '2',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    // POST /api/v2/admin/users
    @Post('users')
    @ApiOperation({ summary: '[ADMIN] Create a new user' })
    @ApiBody({ type: CreateNewUserRequestDto })
    @ApiResponse({ status: 201, description: 'A user has been created successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createNewUser(@Body() dto: CreateNewUserRequestDto): Promise<UserResponseDto> {
        return await this.usersService.createNewUser(dto);
    }

    // PATCH /api/v2/admin/users
    @Patch('users')
    @ApiOperation({ summary: '[ADMIN] Edit user information' })
    @ApiBody({ type: EditUserRequestDto })
    @ApiResponse({ status: 200, description: 'The user information has been updated successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async editUserInformation(@Body() dto: EditUserRequestDto): Promise<UserResponseDto> {
        return await this.usersService.editUserInformation(dto);
    }

    // GET /api/v2/admin/users
    @Get('users')
    @ApiOperation({ summary: '[ADMIN] Get a list of users' })
    @ApiResponse({ status: 200, description: 'The list of users has been found successfully.', type: GetListOfUsersResponseDto })
    @HttpCode(HttpStatus.OK)
    async getListOfUsers(@Query() dto: GetListOfUsersRequestDto): Promise<GetListOfUsersResponseDto> {
        return await this.usersService.getListOfUsers(dto);
    }

    // GET /api/v2/admin/users/:id
    @Get('users/:id')
    @ApiOperation({ summary: '[ADMIN] Get a user by id' })
    @ApiParam({ name: 'id', type: String, description: 'ID of the user', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiResponse({ status: 200, description: 'The user has been found successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
        return await this.usersService.getUserInformationById(id, false) as UserResponseDto;
    }

    // PATCH /api/v2/admin/users/activation/:id/:action
    @Patch('users/activation/:id/:action')
    @ApiOperation({ summary: '[ADMIN] Activate or deactivate a user' })
    @ApiParam({ name: 'id', type: String, description: 'ID of the user', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiParam({ name: 'action', type: String, description: 'Action to perform', example: 'activate', enum: ['activate', 'deactivate'], required: true })
    @ApiResponse({ status: 200, description: 'The user has been activated or deactivated successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async activateOrDeactivateUser(@Param('id') id: string, @Param('action') action: 'activate' | 'deactivate', @CurrentUser() user: AccessTokenPayload): Promise<UserResponseDto> {
        const result = await this.usersService.deactivateOrActivateUser(id, user.id, action === 'activate' ? true : false);
        return result;
    }


    // POST /api/v2/admin/users/reset-password
    @Post('users/reset-password')
    @ApiOperation({ summary: '[ADMIN] Admin reset password for a user' })
    @ApiBody({ type: ForgotPasswordRequestDto })
    @ApiResponse({ status: 200, description: 'The password has been reset successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ForgotPasswordRequestDto): Promise<UserResponseDto> {
        return await this.usersService.adminUpdatePassword(dto);
    }
}
