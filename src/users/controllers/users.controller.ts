import { Controller, Query, Get, Body, Patch, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

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

// Import DTOs.
import { UserChangePasswordRequestDto } from '@libs/common/dtos/users/crudUsersRequest.dto';
import {
    UserResponseDto,
    GetListOfUsersForSearchResponseDto,
} from '@libs/common/dtos/users/crudUsersResponse.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@ApiTags('[Users] Users Operations: These APIs allow users to manage their own account.')
@Controller({
    path: 'api/v2/users',
    version: '2',
})
@UseGuards(JwtAuthGuard, RateLimitGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    // GET /api/v2/users
    @Get()
    @ApiOperation({ summary: '[USER] Get user information' })
    @ApiResponse({ status: 200, description: 'The user information has been found successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async getUserInformation(@CurrentUser() user: AccessTokenPayload): Promise<UserResponseDto> {
        return await this.usersService.getUserInformationById(user.id, false) as UserResponseDto;
    }

    // PATCH /api/v2/users/change-password
    @Patch('change-password')
    @ApiOperation({ summary: '[USER] Change user password' })
    @ApiBody({ type: UserChangePasswordRequestDto })
    @ApiResponse({ status: 200, description: 'The user password has been changed successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.OK)
    async changeUserPassword(@Body() dto: UserChangePasswordRequestDto, @CurrentUser() user: AccessTokenPayload): Promise<UserResponseDto> {
        return await this.usersService.userChangePassword(user.id, dto);
    }

    // GET /api/v2/users/search
    @Get('search')
    @Roles(Role.ADMIN, Role.MANAGER)
    @ApiOperation({ summary: '[ADMIN, MANAGER] Search users by username' })
    @ApiResponse({ status: 200, description: 'The users have been found successfully.', type: GetListOfUsersForSearchResponseDto })
    @HttpCode(HttpStatus.OK)
    async searchUsers(@Query('search') search: string): Promise<GetListOfUsersForSearchResponseDto> {
        return await this.usersService.searchUsers(search);
    }
}
