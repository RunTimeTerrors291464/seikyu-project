import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// Import enums.
import { Role } from '@app/common/enums/role.enum';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/userRole.entity';

// Import DTOs.
import { GetListOfUsersRequestDto } from '@app/common/dtos/platform/users/crudUsersRequest.dto';

@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    ) { }

    // Get a user by id.
    async getUserById(id: string): Promise<[UserEntity, UserRoleEntity[]] | null> {
        // Find the user by id.
        const user: UserEntity | null = await this.userRepository.findOne({
            where: { id },
            relations: ['userRoles']
        });

        if (!user) return null;

        // Extract user roles from the user object.
        const userRoles: UserRoleEntity[] = user.userRoles || [];

        return [user, userRoles];
    }

    // Get a user by username.
    async getUserByUsername(username: string): Promise<[UserEntity, UserRoleEntity[]] | null> {
        // Find the user by username.
        const user: UserEntity | null = await this.userRepository.findOne({
            where: { username },
            relations: ['userRoles']
        });

        if (!user) return null;

        // Extract user roles from the user object.
        const userRoles: UserRoleEntity[] = user.userRoles || [];

        return [user, userRoles];
    }

    // Get a list of users.
    async getListOfUsers(dto: GetListOfUsersRequestDto): Promise<{ data: [UserEntity, UserRoleEntity[]][], total: number }> {
        const { page = 1, limit = 10, search, searchBy, roles, active = 'all', sortBy, sortOrder = 'asc' } = dto;

        const applyFilters = (qb: any) => {
            if (search && searchBy) {
                if (searchBy === 'name') {
                    const tsQuery = search
                        .toLowerCase()
                        .replace(/[!&|:()]/g, '')
                        .split(/\s+/)
                        .filter(word => word.length > 0)
                        .join(' & ');
                    qb.andWhere('user.searchVectorName @@ plainto_tsquery(:search)', {
                        search: tsQuery
                    });
                } else if (searchBy === 'username') {
                    qb.andWhere('user.username ILIKE :search', {
                        search: `%${search}%`,
                    });
                }
            }

            // Apply roles filter.
            if (roles && roles.length > 0) {
                qb.andWhere('userRole.role IN (:...roles)', { roles });
            }

            // Apply active status filter.
            if (active && active !== 'all') {
                const isActive = (active === 'true') ? true : false;
                qb.andWhere('user.active = :active', { active: isActive });
            }

            return qb;
        };

        // Create query builder for counting total.
        let countQueryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.userRoles', 'userRole');

        countQueryBuilder = applyFilters(countQueryBuilder);

        // Get total count before pagination.
        const total = await countQueryBuilder.getCount();

        // Create query builder for fetching data.
        let queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.userRoles', 'userRole');

        queryBuilder = applyFilters(queryBuilder);

        // Apply sorting.
        if (sortBy) {
            queryBuilder.orderBy(`user.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC');
        } else {
            // Default sort by createdAt DESC.
            queryBuilder.orderBy('user.createdAt', 'DESC');
        }

        // Apply pagination.
        queryBuilder.skip((page - 1) * limit).take(limit);

        // Execute query.
        const userEntities = await queryBuilder.getMany();

        // Map each user entity to [UserEntity, UserRoleEntity[]] tuple.
        const data: [UserEntity, UserRoleEntity[]][] = userEntities.map(user => [
            user,
            user.userRoles || []
        ]);

        return { data, total };
    }

    // Users change their password.
    async userChangePassword(user: UserEntity, newPassword: string): Promise<UserEntity> {
        return await this.userRepository.manager.transaction(async (manager) => {
            user.password = newPassword;
            return await manager.save(UserEntity, user);
        });
    }

}