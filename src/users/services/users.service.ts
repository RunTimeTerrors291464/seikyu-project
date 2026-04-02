import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';

// Import bycrypt.
import * as bcrypt from 'bcrypt';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { HandleServiceError } from '@libs/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import entities.
import { DataSource } from 'typeorm';
import { UsersEntity } from '../entities/users.entity';

// Import repositories.
import { UsersRepository } from '../repositories/users.repository';

// Import services.
import { AccessTokenService } from '@src/auth/services/accessToken.service';

// Import DTOs.
import {
    CreateNewUserRequestDto,
    CreateUserAdminRequestDto,
    EditUserRequestDto,
    ForgotPasswordRequestDto,
    GetListOfUsersRequestDto,
    UserChangePasswordRequestDto,
} from '@libs/common/dtos/users/crudUsersRequest.dto';
import {
    UserResponseDto,
    UserResponseWithPasswordDto,
    GetListOfUsersResponseDto,
    UserResponseForSearchResponseDto,
    GetListOfUsersForSearchResponseDto,
} from '@libs/common/dtos/users/crudUsersResponse.dto';

// Import mappers.
import { UsersMapper } from '@libs/common/mappers/users.mapper';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly usersMapper: UsersMapper,
        private readonly dataSource: DataSource,
        @Inject(forwardRef(() => AccessTokenService)) private readonly accessTokenService: AccessTokenService,
    ) { }

    // --- Private variables and methods ---
    private async getUserById(id: string): Promise<UsersEntity> {
        const user: UsersEntity | null = await this.usersRepository.getUserById(id);
        if (user === null) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND, 'The user is not found.');
        return user;
    }

    private async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    // --- Public methods ---
    // Create a first admin account.
    @HandleServiceError(ErrorCode.CREATE_USER_SERVICE)
    async createFirstAdminAccount(dto: CreateUserAdminRequestDto): Promise<UserResponseDto> {
        // Check if the user is the first admin account.
        const userAdminExists = await this.usersRepository.checkAdminRoleExists();
        if (userAdminExists) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.FIRST_ADMIN_ACCOUNT_ALREADY_EXISTS, 'The first admin account already exists.');

        // Hashing the password.
        const hashedPassword: string = await this.hashPassword(dto.password);

        // Create the new admin user with transaction manager.
        const user: UsersEntity = await this.dataSource.transaction(async (transactionManager) => {
            const newUser: UsersEntity = await this.usersRepository.createNewUser(
                { ...dto, password: hashedPassword, roles: [Role.ADMIN] },
                transactionManager
            );
            return newUser;
        });

        return this.usersMapper.toUserResponseDto(user, false);
    }

    // Create a new user.
    @HandleServiceError(ErrorCode.CREATE_USER_SERVICE)
    async createNewUser(dto: CreateNewUserRequestDto): Promise<UserResponseDto> {

        // Check if the user already exists.
        const userExists: UsersEntity | null = await this.usersRepository.getUserByUsername(dto.username);
        if (userExists !== null) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.USER_ALREADY_EXISTS, 'The username is already taken.');

        // Hash the password.
        const hashedPassword: string = await this.hashPassword(dto.password);

        // Create a new user with transaction manager.
        const user: UsersEntity = await this.dataSource.transaction(async (transactionManager) => {
            const newUser: UsersEntity = await this.usersRepository.createNewUser(
                { ...dto, password: hashedPassword },
                transactionManager
            );
            return newUser;
        });

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(user, false);
    }

    // Edit a user information.
    @HandleServiceError(ErrorCode.EDIT_USER_SERVICE)
    async editUserInformation(dto: EditUserRequestDto): Promise<UserResponseDto> {

        // Get user by id.
        const user: UsersEntity | null = await this.getUserById(dto.id);

        // Edit the user information with transaction manager.
        const updatedUser: UsersEntity = await this.dataSource.transaction(async (transactionManager) => {
            const updatedUser: UsersEntity = await this.usersRepository.editUserInformation(user, dto, transactionManager);
            return updatedUser;
        });

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(updatedUser, false);
    }

    // Deactivate or activate a user.
    @HandleServiceError(ErrorCode.DEACTIVATE_OR_ACTIVATE_USER_SERVICE)
    async deactivateOrActivateUser(id: string, actionUserId: string, activateMode: boolean): Promise<UserResponseDto> {

        // Check if the user is the same as the action user.
        if (id === actionUserId) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.USER_CANNOT_DEACTIVATE_SELF, 'You cannot deactivate or activate yourself.');

        // Get the user by id and check if the user is already deactivated or activated.
        const user: UsersEntity | null = await this.getUserById(id);
        if (user.isActive === activateMode) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.USER_ALREADY_DEACTIVATED, 'The user is already deactivated.');

        // Deactivate or activate the user with transaction manager.
        const updatedUser: UsersEntity = await this.dataSource.transaction(async (transactionManager) => {
            const updatedUser: UsersEntity = await this.usersRepository.deactivateOrActivateUser(user, activateMode, transactionManager);
            if (activateMode === false) await this.accessTokenService.revokeAllRefreshTokens(id, transactionManager);

            return updatedUser;
        });

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(updatedUser, false);
    }

    // Admin update password for a user.
    @HandleServiceError(ErrorCode.FORGOT_PASSWORD_SERVICE)
    async adminUpdatePassword(dto: ForgotPasswordRequestDto): Promise<UserResponseDto> {

        // Get the user by id.
        const user: UsersEntity | null = await this.getUserById(dto.id);

        // Hash the password.
        const hashedPassword: string = await this.hashPassword(dto.password);

        // Update the user password with transaction manager.
        const updatedUser: UsersEntity = await this.dataSource.transaction(async (transactionManager) => {
            const updatedUser: UsersEntity = await this.usersRepository.updateUserPassword(user, hashedPassword, transactionManager);
            return updatedUser;
        });

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(updatedUser, false);
    }

    // User change its password.
    @HandleServiceError(ErrorCode.UPDATE_USER_PASSWORD_SERVICE)
    async userChangePassword(userId: string, dto: UserChangePasswordRequestDto): Promise<UserResponseDto> {

        // Get the user by id.
        const user: UsersEntity | null = await this.getUserById(userId);

        // Check if the current password is correct.
        const isPasswordCorrect: boolean = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isPasswordCorrect) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.OLD_PASSWORD_INCORRECT, 'The current password is incorrect.');

        // Hash the password.
        const hashedNewPassword: string = await this.hashPassword(dto.newPassword);

        // Update the user password with transaction manager.
        const updatedUser: UsersEntity = await this.dataSource.transaction(async (transactionManager) => {
            const updatedUser: UsersEntity = await this.usersRepository.updateUserPassword(user, hashedNewPassword, transactionManager);
            return updatedUser;
        });

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(updatedUser, false);
    }

    // Get a user by id.
    @HandleServiceError(ErrorCode.GET_USER_BY_ID_SERVICE)
    async getUserInformationById(id: string, withPassword: boolean): Promise<UserResponseDto | UserResponseWithPasswordDto> {

        // Get the user by id.
        const user: UsersEntity | null = await this.getUserById(id);

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(user, withPassword);
    }

    // Get multiple users information by ids.
    @HandleServiceError(ErrorCode.GET_USER_BY_ID_SERVICE)
    async getMultipleUsersInformationByIds(ids: string[]): Promise<UserResponseDto[]> {

        // Get the users by ids.
        const users: UsersEntity[] | null = await this.usersRepository.getUsersByIds(ids);
        if (users === null) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND, 'The users are not found.');

        // Return the user response DTOs.
        return users.map((user: UsersEntity) => this.usersMapper.toUserResponseDto(user, false));
    }

    // Get a user by username.
    async getUserByUsername(username: string, withPassword: true): Promise<UserResponseWithPasswordDto>;
    async getUserByUsername(username: string, withPassword: false): Promise<UserResponseDto>;

    @HandleServiceError(ErrorCode.GET_USER_BY_USERNAME_SERVICE)
    async getUserByUsername(username: string, withPassword: boolean): Promise<UserResponseDto | UserResponseWithPasswordDto> {

        // Check if the user exists.
        const user: UsersEntity | null = await this.usersRepository.getUserByUsername(username);
        if (user === null) throw new CustomException(HttpStatus.NOT_FOUND, ErrorCode.USER_NOT_FOUND, 'The user is not found.');

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(user, withPassword);
    }

    // Get a list of users.
    @HandleServiceError(ErrorCode.GET_LIST_OF_USERS_SERVICE)
    async getListOfUsers(dto: GetListOfUsersRequestDto): Promise<GetListOfUsersResponseDto> {

        // Get list of users from repository.
        const { data, total } = await this.usersRepository.getListOfUsers(dto);

        // Map user entities to DTOs.
        const users: UserResponseDto[] = data.map((user: UsersEntity) => this.usersMapper.toUserResponseDto(user, false));

        // Return response DTO.
        return {
            page: dto.page || 1,
            limit: dto.limit || 10,
            total,
            users,
        };
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
        const users: UserResponseForSearchResponseDto[] = data.map((user: UsersEntity) => ({
            id: user.id,
            username: user.username,
        }));

        // Return the list of users for search response DTO.
        return {
            page: 1,
            limit: 10,
            total,
            users,
        };
    }

}
