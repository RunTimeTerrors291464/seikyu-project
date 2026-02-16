import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/userRole.entity';

// Import DTOs.
import {
    CreateNewUserRequestDto,
    EditUserRequestDto,
} from '@app/common/dtos/platform/users/crudUsersRequest.dto';

@Injectable()
export class AdminRepository {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
        @InjectRepository(UserRoleEntity) private userRoleRepository: Repository<UserRoleEntity>,
    ) { }

    // Create a new user.
    async createNewUser(dto: CreateNewUserRequestDto): Promise<[UserEntity, UserRoleEntity[]]> {
        return await this.userRepository.manager.transaction(async (transactionalManager) => {

            // Create user entity from DTO.
            const user: UserEntity = await transactionalManager.save(UserEntity, dto);

            // Create user roles entities from DTO.
            const userRoles: UserRoleEntity[] = await transactionalManager.save(
                UserRoleEntity,
                dto.roles.map(role => ({ userId: user.id, role }))
            );

            // Return both user and user roles entities.
            return [user, userRoles];
        });
    }

    // Edit a user information.
    async editUserInformation(user: UserEntity, dto: EditUserRequestDto): Promise<[UserEntity, UserRoleEntity[]]> {
        return await this.userRepository.manager.transaction(async (transactionalManager) => {
            const { id, roles, ...updateData } = dto;

            // Merge and save user.
            this.userRepository.merge(user, updateData);
            const updatedUser = await transactionalManager.save(UserEntity, user);

            // Get current roles.
            const currentRoles = await transactionalManager.find(UserRoleEntity, {
                where: { userId: user.id }
            });

            const currentRoleValues = currentRoles.map(r => r.role);
            const rolesToDelete = currentRoles.filter(r => !roles.includes(r.role));
            const rolesToAdd = roles.filter(r => !currentRoleValues.includes(r));

            // Delete and add roles.
            if (rolesToDelete.length > 0) {
                await transactionalManager.remove(UserRoleEntity, rolesToDelete);
            }
            if (rolesToAdd.length > 0) {
                await transactionalManager.save(
                    UserRoleEntity,
                    rolesToAdd.map(role => ({ userId: updatedUser.id, role }))
                );
            }

            // Get & return updated user with roles.
            const userWithRoles = await transactionalManager.findOne(UserEntity, {
                where: { id: updatedUser.id },
                relations: ['userRoles']
            }) as UserEntity;

            return [userWithRoles, userWithRoles.userRoles || []];
        });
    }

    // Check if the first admin account already exists.
    async checkAdminRoleExists(): Promise<boolean> {
        const user: UserRoleEntity | null = await this.userRoleRepository.findOne({
            where: { role: Role.ADMIN },
        });
        return user !== null;
    }

    // Deactivate a user.
    async deactivateUser(user: UserEntity): Promise<UserEntity> {
        return await this.userRepository.manager.transaction(async (transactionalManager) => {
            user.active = false;
            return await transactionalManager.save(UserEntity, user);
        });
    }

    // Activate a user.
    async activateUser(user: UserEntity): Promise<UserEntity> {
        return await this.userRepository.manager.transaction(async (transactionalManager) => {
            user.active = true;
            return await transactionalManager.save(UserEntity, user);
        });
    }

    // Admin update password of a user.
    async adminChangePassword(user: UserEntity, newPassword: string): Promise<UserEntity> {
        return await this.userRepository.manager.transaction(async (transactionalManager) => {
            user.password = newPassword;
            return await transactionalManager.save(UserEntity, user);
        });
    }
}
