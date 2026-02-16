import { Controller } from '@nestjs/common';

// Import TCP message pattern.
import { MessagePattern } from '@nestjs/microservices';

// Import services.
import { AdminService } from '../services/admin.service';

// Import DTOs.
import {
    CreateNewUserRequestDto,
    EditUserRequestDto
} from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import { ForgotPasswordRequestDto } from '@app/common/dtos/platform/users/forgotPasswordRequest.dto';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

@Controller('admin')
export class AdminController {
    constructor(
        private readonly adminService: AdminService
    ) { }

    // Create a new user.
    @MessagePattern({ cmd: 'admin.createNewUser' })
    async createNewUser(dto: CreateNewUserRequestDto): Promise<UserResponseDto> {
        return this.adminService.createNewUser(dto);
    }

    // Edit user information.
    @MessagePattern({ cmd: 'admin.editUserInformation' })
    async editUserInformation(dto: EditUserRequestDto): Promise<UserResponseDto> {
        return this.adminService.editUserInformation(dto);
    }

    // Deactivate a user.
    @MessagePattern({ cmd: 'admin.deactivateUser' })
    async deactivateUser(data: { id: string; actionUserId: string }): Promise<UserResponseDto> {
        return this.adminService.deactivateUser(data.id, data.actionUserId);
    }

    // Activate a user.
    @MessagePattern({ cmd: 'admin.activateUser' })
    async activateUser(id: string): Promise<UserResponseDto> {
        return this.adminService.activateUser(id);
    }

    // Admin reset password for a user.
    @MessagePattern({ cmd: 'admin.forgotPassword' })
    async forgotPassword(dto: ForgotPasswordRequestDto): Promise<UserResponseDto> {
        return this.adminService.forgotPassword(dto);
    }
}