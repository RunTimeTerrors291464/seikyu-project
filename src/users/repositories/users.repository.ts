import { Injectable } from '@nestjs/common';
import { EntityManager, In, Repository } from 'typeorm';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import entities.
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from '../entities/users.entity';

// Import DTOs.
import {
    CreateNewUserRequestDto,
    EditUserRequestDto,
    GetListOfUsersRequestDto,
} from '@libs/common/dtos/users/crudUsersRequest.dto';


@Injectable()
export class UsersRepository {
    constructor(
        @InjectRepository(UsersEntity) private readonly usersRepository: Repository<UsersEntity>
    ) { }

    // Create a new user.
    async createNewUser(dto: CreateNewUserRequestDto, manager: EntityManager): Promise<UsersEntity> {
        const { roles, ...userFields } = dto;

        const user: UsersEntity = await manager.save(UsersEntity, {
            ...userFields,
            isAdmin: roles.includes(Role.ADMIN),
            isManager: roles.includes(Role.MANAGER),
            isCashier: roles.includes(Role.CASHIER),
        });

        return user;
    }

    // Edit a user information.
    async editUserInformation(user: UsersEntity, dto: EditUserRequestDto, manager: EntityManager): Promise<UsersEntity> {
        const { id, roles, ...updateData } = dto;

        // Prepare update data with role boolean columns.
        const updatePayload = {
            ...updateData,
            ...(roles && {
                isAdmin: roles.includes(Role.ADMIN),
                isManager: roles.includes(Role.MANAGER),
                isCashier: roles.includes(Role.CASHIER),
            }),
        };

        // Merge and save user.
        this.usersRepository.merge(user, updatePayload);
        return await manager.save(UsersEntity, user);
    }

    // Deactivate or activate a user.
    async deactivateOrActivateUser(user: UsersEntity, isActive: boolean, manager: EntityManager): Promise<UsersEntity> {
        user.isActive = isActive;
        return await manager.save(UsersEntity, user);
    }

    // Update a user password.
    async updateUserPassword(user: UsersEntity, newPassword: string, manager: EntityManager): Promise<UsersEntity> {
        user.password = newPassword;
        return await manager.save(UsersEntity, user);
    }

    // Get a user by id.
    async getUserById(id: string): Promise<UsersEntity | null> {
        return await this.usersRepository.findOne({ where: { id } });
    }

    // Get bulk of users by ids.
    async getUsersByIds(ids: string[]): Promise<UsersEntity[] | null> {
        if (ids.length === 0) return null;
        const users: UsersEntity[] = await this.usersRepository.find({ where: { id: In(ids) } });
        return users;
    }

    // Get a user by username.
    async getUserByUsername(username: string): Promise<UsersEntity | null> {
        return await this.usersRepository.findOne({ where: { username } });
    }

    // Check if the first admin account already exists.
    async checkAdminRoleExists(): Promise<UsersEntity | null> {
        return await this.usersRepository.findOne({ where: { isAdmin: true } });
    }

    // Get a list of users.
    async getListOfUsers(dto: GetListOfUsersRequestDto): Promise<{ data: UsersEntity[], total: number }> {
        const { page = 1, limit = 25, search, searchBy, roles, isActive = 'all', sortBy, sortOrder = 'asc' } = dto;

        // Calculate the offset and limit.
        const offset = (page - 1) * limit;

        // Create the query builder.
        const qb = this.usersRepository.createQueryBuilder('users');

        // --- 1. FILTER ---
        if (isActive !== 'all') {
            qb.andWhere('users.is_active = :isActive', { isActive: isActive === 'true' });
        }

        if (roles && roles.length > 0) {
            const roleConditions: string[] = [];
            if (roles.includes(Role.ADMIN)) roleConditions.push('users.is_admin = true');
            if (roles.includes(Role.MANAGER)) roleConditions.push('users.is_manager = true');
            if (roles.includes(Role.CASHIER)) roleConditions.push('users.is_cashier = true');
            if (roleConditions.length > 0) {
                qb.andWhere(`(${roleConditions.join(' OR ')})`);
            }
        }

        // --- 2. SEARCH ---
        if (search) {
            if (searchBy === 'fullName') {
                qb.andWhere(`users.search_vector_name @@ plainto_tsquery('simple', unaccent(:search))`, { search });
            }
            else if (searchBy === 'username') {
                qb.andWhere('users.username ILIKE :search', { search: `%${search}%` });
            }
        }

        // --- 3. SORT ---
        const sortDirection = sortOrder.toUpperCase() as 'ASC' | 'DESC';

        const applySort = (builder: typeof qb) => {
            if (sortBy === 'fullName') {
                builder.orderBy('users.first_name', sortDirection)
                    .addOrderBy('users.last_name', sortDirection)
                    .addOrderBy('users.middle_name', sortDirection);
            }
            else {
                const sortMap: Record<string, string> = {
                    username: 'users.username',
                    createdAt: 'users.created_at',
                    updatedAt: 'users.updated_at',
                    isActive: 'users.is_active',
                };
                const sortColumn = (sortBy ? sortMap[sortBy] : null) ?? 'users.created_at'; // Default to createdAt if no sortBy is provided.
                builder.orderBy(sortColumn, sortDirection);
            }
            builder.addOrderBy('users.id', 'ASC'); // Default to id in ascending order.
        };

        applySort(qb);

        // --- 4. PAGINATE ---
        const idSubQuery = qb.clone()
            .select('users.id')
            .offset(offset)
            .limit(limit)
            .getQuery();

        const outerQb = this.usersRepository.createQueryBuilder('users')
            .where(`users.id IN (${idSubQuery})`)
            .setParameters(qb.getParameters());
        applySort(outerQb);

        const [data, total] = await Promise.all([
            outerQb.getMany(),
            qb.clone().getCount(),
        ]);

        return { data, total };
    }



}
