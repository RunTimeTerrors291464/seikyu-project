import { Injectable } from '@nestjs/common';

// Import user entities.
import { UserEntity } from 'apps/platform/src/users/entities/user.entity';
import { UserRoleEntity } from 'apps/platform/src/users/entities/userRole.entity';

// Import DTOs.
import { UserResponseDto, UserResponseWithPasswordDto } from '@app/common/dtos/platform/users/crudUsersReponse.dto';

@Injectable()
export class UsersMapper {

    // FROM: UserEntity, UserRoleEntity[]
    // TO: UserResponseDto | UserResponseWithPasswordDto
    toUserResponseDto(
        userEntity: UserEntity,
        userRoleEntities: UserRoleEntity[],
        withPassword: boolean = false
    ): UserResponseDto | UserResponseWithPasswordDto {
        if (withPassword === true) {
            return {
                id: userEntity.id,
                firstName: userEntity.firstName,
                middleName: userEntity.middleName,
                lastName: userEntity.lastName,
                username: userEntity.username,
                roles: userRoleEntities.map(role => role.role),
                active: userEntity.active,
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
                roles: userRoleEntities.map(role => role.role),
                active: userEntity.active,
                createdAt: userEntity.createdAt,
                updatedAt: userEntity.updatedAt,
            };
        }
    }
}

