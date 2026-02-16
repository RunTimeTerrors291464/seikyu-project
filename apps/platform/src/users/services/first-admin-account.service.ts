import { HttpStatus, Injectable } from '@nestjs/common';

// Import bycrypt.
import * as bcrypt from 'bcrypt';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { HandleServiceError } from '@app/common/decorators/handleServiceError.decorator';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import entities.
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/userRole.entity';

// Import repositories.
import { AdminRepository } from '../repositories/admin.repository';
import { UsersRepository } from '../repositories/users.repository';

// Import DTOs.
import { CreateUserAdminRequestDto } from '@app/common/dtos/platform/users/crudUsersRequest.dto';
import { UserResponseDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

// Import mappers.
import { UsersMapper } from '@app/common/mappers/platform/users.mapper';

@Injectable()
export class FirstAdminAccountService {
    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly usersMapper: UsersMapper
    ) { }

    // Create a first admin account.
    @HandleServiceError(ErrorCode.CREATE_USER_SERVICE)
    async createFirstAdminAccount(dto: CreateUserAdminRequestDto): Promise<UserResponseDto> {
        // Check if the user is the first admin account.
        const userAdminExists = await this.adminRepository.checkAdminRoleExists();
        if (userAdminExists) throw new CustomException(HttpStatus.BAD_REQUEST, ErrorCode.FIRST_ADMIN_ACCOUNT_ALREADY_EXISTS, 'The first admin account already exists.');

        // Hashing the password.
        const hashedPassword: string = await bcrypt.hash(dto.password, 10);

        // Creating the user with ADMIN role.
        const [user, userRoles]: [UserEntity, UserRoleEntity[]] = await this.adminRepository.createNewUser({
            ...dto,
            password: hashedPassword,
            roles: [Role.ADMIN]
        });

        // Return the user response DTO.
        return this.usersMapper.toUserResponseDto(user, userRoles, false);
    }
}