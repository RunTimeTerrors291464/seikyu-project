import { HttpStatus, Injectable } from '@nestjs/common';

// Import bycrypt.
import * as bcrypt from 'bcrypt';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import entities.
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/userRole.entity';

// Import repositories.
import { UsersRepository } from '../repositories/users.repository';

// Import services.
import { AdminService, UserWithRolesEntity } from './admin.service';

// Import DTOs.
import { GetListOfUsersRequestDto } from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import { UserChangePasswordRequestDto } from '@app/common/dtos/platform/users/userChangePasswordRequest.dto';
import {
    UserResponseDto,
    UserResponseWithPasswordDto,
    UserResponseForSearchResponseDto,
    GetListOfUsersResponseDto,
    GetListOfUsersForSearchResponseDto
} from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import mappers.
import { UsersMapper } from '@app/common/mappers/platform/users.mapper';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly adminService: AdminService,
        private readonly usersMapper: UsersMapper,
    ) { }

    // Get a user by id.
    @HandleServiceError(ErrorCode.GET_USER_BY_ID_SERVICE)
    async getUserById(id: string, withPassword: boolean): Promise<UserResponseDto | UserResponseWithPasswordDto> {

        // Check if the user exists.
        const user: UserWithRolesEntity = await this.adminService.getUserById(id);

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(user[0], user[1], withPassword);
    }

    // Get multiple users by their ids.
    @HandleServiceError(ErrorCode.GET_USER_BY_ID_SERVICE)
    async getUsersByIds(ids: string[]): Promise<UserResponseDto[]> {
        const usersWithRoles = await this.usersRepository.getUsersByIds(ids);

        return usersWithRoles.map(([user, userRoles]) =>
            this.usersMapper.toUserResponseDto(user, userRoles, false) as UserResponseDto
        );
    }

    // Get a user by username.
    @HandleServiceError(ErrorCode.GET_USER_BY_USERNAME_SERVICE)
    async getUserByUsername(username: string, withPassword: boolean): Promise<UserResponseDto | UserResponseWithPasswordDto> {

        // Check if the user exists.
        const user: [UserEntity, UserRoleEntity[]] | null = await this.usersRepository.getUserByUsername(username);
        if (user === null) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND, 'The user is not found.');

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(user[0], user[1], withPassword);
    }

    // Get a list of users.
    @HandleServiceError(ErrorCode.GET_LIST_OF_USERS_SERVICE)
    async getListOfUsers(dto: GetListOfUsersRequestDto): Promise<GetListOfUsersResponseDto> {

        // Get list of users from repository.
        const { data, total } = await this.usersRepository.getListOfUsers(dto);

        // Map user entities to DTOs.
        const users: UserResponseDto[] = data.map(([user, userRoles]) =>
            this.usersMapper.toUserResponseDto(user, userRoles, false) as UserResponseDto
        );

        // Return response DTO.
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            users,
        };
    }

    // Users change their password.
    @HandleServiceError(ErrorCode.USER_CHANGE_PASSWORD_SERVICE)
    async userChangePassword(userId: string, dto: UserChangePasswordRequestDto): Promise<boolean> {

        // Get the user by id.
        const user: UserWithRolesEntity = await this.adminService.getUserById(userId);
        const [userEntity] = user;

        // Check if the current password is correct.
        const isPasswordCorrect: boolean = await bcrypt.compare(dto.currentPassword, userEntity.password);
        if (!isPasswordCorrect) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.OLD_PASSWORD_INCORRECT, 'The current password is incorrect.');

        // Check if the new password is the same as the confirm password.
        if (dto.newPassword !== dto.confirmPassword) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.OLD_PASSWORD_INCORRECT, 'The new password and confirm password do not match.');

        // Hash the new password and change the password of the user.
        const hashedNewPassword: string = await bcrypt.hash(dto.newPassword, 10);
        await this.usersRepository.userChangePassword(userEntity, hashedNewPassword);

        return true;
    }

    // Search method to get users' username and id.
    @HandleServiceError(ErrorCode.SEARCH_USERS_SERVICE)
    async searchUsers(search: string): Promise<GetListOfUsersForSearchResponseDto> {

        // Get list of users from repository.
        const { data, total } = await this.usersRepository.getListOfUsers({
            search,
            searchBy: 'username',
            page: 1,
            limit: 10,
        });

        // Map user entities to DTOs.
        const users: UserResponseForSearchResponseDto[] = data.map(([user]) => ({
            id: user.id,
            username: user.username,
        }));

        // Return response DTO.
        return {
            page: 1,
            limit: 10,
            total,
            users,
        };
    }

}