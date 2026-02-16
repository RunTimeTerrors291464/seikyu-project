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
import { AdminRepository } from '../repositories/admin.repository';
import { UsersRepository } from '../repositories/users.repository';

// Import DTOs.
import {
    CreateNewUserRequestDto,
    EditUserRequestDto,
} from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import { ForgotPasswordRequestDto } from '@app/common/dtos/platform/users/forgotPasswordRequest.dto';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import mappers.
import { UsersMapper } from '@app/common/mappers/platform/users.mapper';

export type UserWithRolesEntity = [UserEntity, UserRoleEntity[]];

@Injectable()
export class AdminService {
    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly usersRepository: UsersRepository,
        private readonly usersMapper: UsersMapper,
    ) { }

    // --- DRY methods ---
    async getUserById(id: string): Promise<UserWithRolesEntity> {
        const user: UserWithRolesEntity | null = await this.usersRepository.getUserById(id);
        if (user === null) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND, 'The user is not found.');
        return user;
    }

    // --- APIs ---
    // Create a new user.
    @HandleServiceError(ErrorCode.CREATE_USER_SERVICE)
    async createNewUser(dto: CreateNewUserRequestDto): Promise<UserResponseDto> {

        // Check if the user already exists.
        const userExists: [UserEntity, UserRoleEntity[]] | null = await this.usersRepository.getUserByUsername(dto.username);
        if (userExists !== null) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.USER_ALREADY_EXISTS, 'The username is already taken.');

        // Hash the password.
        const hashedPassword: string = await bcrypt.hash(dto.password, 10);

        // Create a new user.
        const [user, userRoles]: [UserEntity, UserRoleEntity[]] = await this.adminRepository.createNewUser({ ...dto, password: hashedPassword });

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(user, userRoles, false);
    }

    // Edit a user information.
    @HandleServiceError(ErrorCode.EDIT_USER_SERVICE)
    async editUserInformation(dto: EditUserRequestDto): Promise<UserResponseDto> {

        // Get user by id.
        const user: UserWithRolesEntity = await this.getUserById(dto.id);

        // Edit the user information.
        const [updatedUser, updatedUserRoles]: UserWithRolesEntity = await this.adminRepository.editUserInformation(user[0], dto);

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(updatedUser, updatedUserRoles, false);
    }

    // Deactivate a user.
    @HandleServiceError(ErrorCode.DEACTIVATE_USER_SERVICE)
    async deactivateUser(id: string, actionUserId: string): Promise<UserResponseDto> {

        // Check if the user is the same as the deactivated user.
        if (actionUserId === id) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.USER_CANNOT_DEACTIVATE_SELF, 'You cannot deactivate yourself.');

        // Get user by id.
        const user: UserWithRolesEntity = await this.getUserById(id);
        const [userEntity] = user;

        // Check if the user is already deactivated.
        if (!userEntity.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.USER_ALREADY_DEACTIVATED, 'The user is already deactivated.');

        // Deactivate the user.
        await this.adminRepository.deactivateUser(userEntity);

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(userEntity, userEntity.userRoles, false);
    }

    // Activate a user.
    @HandleServiceError(ErrorCode.ACTIVATE_USER_SERVICE)
    async activateUser(id: string): Promise<UserResponseDto> {

        // Get user by id.
        const user: UserWithRolesEntity = await this.getUserById(id);
        const [userEntity] = user;

        // Check if the user is already activated.
        if (userEntity.active) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.USER_ALREADY_ACTIVATED, 'The user is already activated.');

        // Activate the user.
        await this.adminRepository.activateUser(userEntity);

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(userEntity, userEntity.userRoles, false);
    }

    // Admin update password of a user.
    @HandleServiceError(ErrorCode.FORGOT_PASSWORD_SERVICE)
    async forgotPassword(dto: ForgotPasswordRequestDto): Promise<UserResponseDto> {

        // Get user by id.
        const user: UserWithRolesEntity = await this.getUserById(dto.id);
        const [userEntity] = user;

        // Hash the password and change the password of the user.
        const hashedPassword: string = await bcrypt.hash(dto.password, 10);
        await this.adminRepository.adminChangePassword(userEntity, hashedPassword);

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(userEntity, userEntity.userRoles, false);
    }
}
