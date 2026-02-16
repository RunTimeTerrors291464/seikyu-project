import { Controller, Post, Body, Inject, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

// Import swagger.
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

// Import guards.
import { JwtAuthGuard, Public } from '../../auth/guards';

// Import microservices client proxy.
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

// Import DTOs.
import { CreateUserAdminRequestDto } from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

@ApiTags('[Platform] First Admin Account: This API is for creating the first admin account.')
@Controller({
    path: 'api/v1/admin',
    version: '1'
})
@UseGuards(JwtAuthGuard)
export class FirstAdminAccountController {
    constructor(
        @Inject('PLATFORM_SERVICE') private readonly platformService: ClientProxy
    ) { }

    // Create a new user.
    // POST /api/v1/admin/first-admin-account
    @Post('first-admin-account')
    @Public()
    @ApiOperation({ summary: '[PUBLIC] Create the first admin account' })
    @ApiBody({ type: CreateUserAdminRequestDto })
    @ApiResponse({ status: 201, description: 'The first admin account has been created successfully.', type: UserResponseDto })
    @HttpCode(HttpStatus.CREATED)
    async createFirstAdminAccount(@Body() dto: CreateUserAdminRequestDto): Promise<UserResponseDto> {
        try {
            const result: UserResponseDto = await firstValueFrom(
                this.platformService.send({ cmd: 'firstAdminAccount.createFirstAdminAccount' }, dto)
            );
            return result;
        } catch (error: any) {
            if (error.status && error.errorCode) throw new CustomException(error.status, error.errorCode, error.message, error.errorDetails);
            throw new CustomException(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.UNKNOWN_ERROR, error.message);
        }
    }
}