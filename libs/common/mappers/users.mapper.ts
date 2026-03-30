import { Injectable } from '@nestjs/common';

// Import user entities.
import { UsersEntity } from '@src/users/entities/users.entity';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import DTOs.
import { UserResponseDto, UserResponseWithPasswordDto } from '@libs/common/dtos/users/crudUsersResponse.dto';


@Injectable()
export class UsersMapper {

    // --- Helper methods ---
    private getRolesFromUser(userEntity: UsersEntity): Role[] {
        const roles: Role[] = [];
        if (userEntity.isAdmin) roles.push(Role.ADMIN);
        if (userEntity.isManager) roles.push(Role.MANAGER);
        if (userEntity.isCashier) roles.push(Role.CASHIER);

        return roles;
    }

    // FROM: UserEntity
    // TO: UserResponseDto | UserResponseWithPasswordDto
    toUserResponseDto(
        userEntity: UsersEntity,
        withPassword: boolean = false
    ): UserResponseDto | UserResponseWithPasswordDto {

        // Get the roles from the user entity.
        const roles: Role[] = this.getRolesFromUser(userEntity);

        if (withPassword === true) {
            return {
                id: userEntity.id,
                firstName: userEntity.firstName,
                middleName: userEntity.middleName,
                lastName: userEntity.lastName,
                username: userEntity.username,
                roles: roles,
                isActive: userEntity.isActive,
                password: userEntity.password,
                createdAt: userEntity.createdAt,
                updatedAt: userEntity.updatedAt,
            };
        } else {
            return {
                id: userEntity.id,
                firstName: userEntity.firstName,
                middleName: userEntity.middleName,
                lastName: userEntity.lastName,
                username: userEntity.username,
                roles: roles,
                isActive: userEntity.isActive,
                createdAt: userEntity.createdAt,
                updatedAt: userEntity.updatedAt,
            };
        }
    }
}

