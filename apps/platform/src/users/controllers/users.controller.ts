import { Controller } from '@nestjs/common';

// Import TCP message pattern.
import { MessagePattern } from '@nestjs/microservices';

// Import services.
import { UsersService } from '../services/users.service';

// Import DTOs.
import { GetListOfUsersRequestDto } from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import {
    UserResponseDto,
    UserResponseWithPasswordDto,
    GetListOfUsersResponseDto,
    GetListOfUsersForSearchResponseDto
} from '@app/common/dtos/platform/users/crudUsersReponse.dto';
import { UserChangePasswordRequestDto } from '@app/common/dtos/platform/users/userChangePasswordRequest.dto';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }

    // Get a user by id.
    @MessagePattern({ cmd: 'users.getUserById' })
    async getUserById(data: { id: string; withPassword: boolean }): Promise<UserResponseDto | UserResponseWithPasswordDto> {
        return this.usersService.getUserById(data.id, data.withPassword);
    }

    // Get multiple users by their ids.
    @MessagePattern({ cmd: 'users.getUsersByIds' })
    async getUsersByIds(data: { ids: string[] }): Promise<UserResponseDto[]> {
        return this.usersService.getUsersByIds(data.ids);
    }

    // Get a user by username.
    @MessagePattern({ cmd: 'users.getUserByUsername' })
    async getUserByUsername(data: { username: string; withPassword: boolean }): Promise<UserResponseDto | UserResponseWithPasswordDto> {
        return this.usersService.getUserByUsername(data.username, data.withPassword);
    }

    // Get a list of users.
    @MessagePattern({ cmd: 'users.getListOfUsers' })
    async getListOfUsers(dto: GetListOfUsersRequestDto): Promise<GetListOfUsersResponseDto> {
        return this.usersService.getListOfUsers(dto);
    }

    // Users change their password.
    @MessagePattern({ cmd: 'users.userChangePassword' })
    async userChangePassword(data: { userId: string; dto: UserChangePasswordRequestDto }): Promise<boolean> {
        return this.usersService.userChangePassword(data.userId, data.dto);
    }

    // Search method to get users' username and id.
    @MessagePattern({ cmd: 'users.searchUsers' })
    async searchUsers(search: string): Promise<GetListOfUsersForSearchResponseDto> {
        return this.usersService.searchUsers(search);
    }
}
