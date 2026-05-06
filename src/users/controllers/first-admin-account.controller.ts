import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

// Import decorators.
import { Public } from '../../auth/decorators/public.decorator';

// Import services.
import { UsersService } from '../services/users.service';

// Import DTOs.
import { CreateUserAdminRequestDto } from '@libs/common/dtos/users/crudUsersRequest.dto';
import { UserResponseDto } from '@libs/common/dtos/users/crudUsersResponse.dto';

@ApiTags('[Users] First Admin Account: This API is for creating the first admin account.')
@Controller({
    path: 'api/v2/admin',
    version: '2',
})
@UseGuards(JwtAuthGuard)
export class FirstAdminAccountController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    // POST /api/v2/admin/first-admin-account
    @Post('first-admin-account')
    @Public()
    @ApiOperation({ summary: '[PUBLIC] Create the first admin account' })
    @ApiBody({ type: CreateUserAdminRequestDto })
    @ApiResponse({ status: 201, description: 'The first admin account has been created successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createFirstAdminAccount(@Body() dto: CreateUserAdminRequestDto): Promise<UserResponseDto> {
        return await this.usersService.createFirstAdminAccount(dto);
    }
}
