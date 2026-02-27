import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Import entities.
import { UserEntity } from '../../src/users/entities/user.entity';
import { UserRoleEntity } from '../../src/users/entities/userRole.entity';

// Import modules.
import { UsersModule } from '../../src/users/users.module';

// Import services.
import { FirstAdminAccountService } from '../../src/users/services/first-admin-account.service';
import { AdminService } from '../../src/users/services/admin.service';
import { UsersService } from '../../src/users/services/users.service';

// Import DTOs.
import { CreateUserAdminRequestDto, CreateNewUserRequestDto, EditUserRequestDto } from '../../../../libs/common/src/dtos/platform/users/crudUsersRequest.dto';
import { ForgotPasswordRequestDto } from '../../../../libs/common/src/dtos/platform/users/forgotPasswordRequest.dto';
import { UserChangePasswordRequestDto } from '../../../../libs/common/src/dtos/platform/users/userChangePasswordRequest.dto';
import { UserResponseDto, UserResponseWithPasswordDto, GetListOfUsersResponseDto, GetListOfUsersForSearchResponseDto } from '../../../../libs/common/src/dtos/platform/users/crudUsersReponse.dto';

// Import enums.
import { Role } from '../../../../libs/common/src/enums/role.enum';

// Import error handling.
import { CustomException } from '../../../../libs/common/src/error-exceptions/customException';

// Import shared state (used to pass data to subsequent spec files).
import { integrationState } from './integration-state';

/**
 * Integration tests for the Users module — uses a real PostgreSQL database.
 *
 * Test flow:
 *   1. createFirstAdminAccount  -> create first admin account (empty DB)
 *   2. Admin operations         -> createNewUser, editUser, deactivate, activate, forgotPassword
 *   3. Users operations         -> getUserById, getUserByUsername, getListOfUsers, changePassword, searchUsers
 *
 * Run: npm run test:integration:platform
 */

describe('Users Integration Tests (Real DB)', () => {
    let module: TestingModule;
    let dataSource: DataSource;
    let firstAdminAccountService: FirstAdminAccountService;
    let adminService: AdminService;
    let usersService: UsersService;

    // Data persisted across tests.
    let adminUser: UserResponseDto;
    let createdUser: UserResponseDto;

    // ─── SETUP ───────────────────────────────────────────────────────────

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                // Load .env file.
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),

                // Connect to the real DB using environment variables.
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => ({
                        type: 'postgres',
                        host: configService.getOrThrow('DB_HOST_PLATFORM'),
                        port: parseInt(configService.getOrThrow('DB_PORT_PLATFORM')),
                        username: configService.getOrThrow('DB_USERNAME_PLATFORM'),
                        password: configService.getOrThrow('DB_PASSWORD_PLATFORM'),
                        database: configService.getOrThrow('DB_DATABASE_PLATFORM'),
                        entities: [UserEntity, UserRoleEntity],
                        synchronize: false, // Do not auto-create tables; use migrations instead.
                        logging: false,
                    }),
                    inject: [ConfigService],
                }),

                TypeOrmModule.forFeature([UserEntity, UserRoleEntity]),

                // Import UsersModule which includes controllers, services, repositories, and mappers.
                UsersModule,
            ],
        }).compile();

        firstAdminAccountService = module.get<FirstAdminAccountService>(FirstAdminAccountService);
        adminService = module.get<AdminService>(AdminService);
        usersService = module.get<UsersService>(UsersService);
        dataSource = module.get<DataSource>(DataSource);
    }, 30000); // Extended timeout to allow for DB connection.

    afterAll(async () => {
        // Do not clean up here — globalTeardown deletes all DB data after
        // ALL spec files have finished (including 02-products, ...).
        await dataSource.destroy();
        await module.close();
    }, 15000);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. FIRST ADMIN ACCOUNT
    // ═══════════════════════════════════════════════════════════════════════

    describe('1. FirstAdminAccount', () => {

        it('should create the first admin account successfully', async () => {
            const dto: CreateUserAdminRequestDto = {
                firstName: 'Admin',
                middleName: 'Super',
                lastName: 'User',
                username: 'admin_test',
                password: 'AdminPassword123!',
            };

            const result = await firstAdminAccountService.createFirstAdminAccount(dto);

            // Persist for use in subsequent tests.
            adminUser = result as UserResponseDto;

            // Write to shared state so 02-products and other specs can read it.
            integrationState.adminUserId = result.id;

            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.firstName).toBe('Admin');
            expect(result.middleName).toBe('Super');
            expect(result.lastName).toBe('User');
            expect(result.username).toBe('admin_test');
            expect(result.roles).toContain(Role.ADMIN);
            expect(result.active).toBe(true);
            expect(result.createdAt).toBeDefined();
            expect(result.updatedAt).toBeDefined();

            // Should not return the password.
            expect((result as any).password).toBeUndefined();
        });

        it('should throw error when trying to create first admin account again', async () => {
            const dto: CreateUserAdminRequestDto = {
                firstName: 'Another',
                lastName: 'Admin',
                username: 'admin_test_2',
                password: 'AdminPassword123!',
            };

            await expect(
                firstAdminAccountService.createFirstAdminAccount(dto),
            ).rejects.toThrow(CustomException);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 2. ADMIN OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    describe('2. Admin Operations', () => {

        // ─── CREATE NEW USER ─────────────────────────────────────────────

        describe('createNewUser', () => {
            it('should create a new user with CASHIER role', async () => {
                const dto: CreateNewUserRequestDto = {
                    firstName: 'Cashier',
                    middleName: 'Test',
                    lastName: 'User',
                    username: 'cashier_test',
                    password: 'CashierPassword123!',
                    roles: [Role.CASHIER],
                };

                const result = await adminService.createNewUser(dto);

                createdUser = result as UserResponseDto;

                // Write to shared state.
                integrationState.cashierUserId = result.id;

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.firstName).toBe('Cashier');
                expect(result.middleName).toBe('Test');
                expect(result.lastName).toBe('User');
                expect(result.username).toBe('cashier_test');
                expect(result.roles).toContain(Role.CASHIER);
                expect(result.active).toBe(true);
                expect((result as any).password).toBeUndefined();
            });

            it('should create a new user with multiple roles', async () => {
                const dto: CreateNewUserRequestDto = {
                    firstName: 'Manager',
                    lastName: 'User',
                    username: 'manager_test',
                    password: 'ManagerPassword123!',
                    roles: [Role.MANAGER, Role.CASHIER],
                };

                const result = await adminService.createNewUser(dto);

                // Persist for 02-products spec — ProductsService requires an AccessTokenPayload.
                integrationState.managerUserId = result.id;

                expect(result).toBeDefined();
                expect(result.roles).toEqual(expect.arrayContaining([Role.MANAGER, Role.CASHIER]));
                expect(result.roles).toHaveLength(2);
            });

            it('should throw error when creating user with existing username', async () => {
                const dto: CreateNewUserRequestDto = {
                    firstName: 'Duplicate',
                    username: 'cashier_test', // Already taken username.
                    password: 'SomePassword123!',
                    roles: [Role.CASHIER],
                };

                await expect(adminService.createNewUser(dto)).rejects.toThrow(CustomException);
            });
        });

        // ─── EDIT USER INFORMATION ───────────────────────────────────────

        describe('editUserInformation', () => {
            it('should edit user first name and last name', async () => {
                const dto: EditUserRequestDto = {
                    id: createdUser.id,
                    firstName: 'CashierEdited',
                    lastName: 'UserEdited',
                    roles: [Role.CASHIER],
                };

                const result = await adminService.editUserInformation(dto);

                expect(result).toBeDefined();
                expect(result.firstName).toBe('CashierEdited');
                expect(result.lastName).toBe('UserEdited');
                // Username should remain unchanged.
                expect(result.username).toBe('cashier_test');
            });

            it('should edit user roles', async () => {
                const dto: EditUserRequestDto = {
                    id: createdUser.id,
                    roles: [Role.MANAGER, Role.CASHIER], // Add MANAGER role.
                };

                const result = await adminService.editUserInformation(dto);

                expect(result.roles).toEqual(expect.arrayContaining([Role.MANAGER, Role.CASHIER]));
                expect(result.roles).toHaveLength(2);
            });

            it('should throw error when editing non-existent user', async () => {
                const dto: EditUserRequestDto = {
                    id: '00000000-0000-0000-0000-000000000000',
                    firstName: 'Ghost',
                    roles: [Role.CASHIER],
                };

                await expect(adminService.editUserInformation(dto)).rejects.toThrow(CustomException);
            });
        });

        // ─── DEACTIVATE USER ─────────────────────────────────────────────

        describe('deactivateUser', () => {
            it('should deactivate a user', async () => {
                const result = await adminService.deactivateUser(createdUser.id, adminUser.id);

                expect(result).toBeDefined();
                expect(result.active).toBe(false);
            });

            it('should throw error when deactivating already deactivated user', async () => {
                await expect(
                    adminService.deactivateUser(createdUser.id, adminUser.id),
                ).rejects.toThrow(CustomException);
            });

            it('should throw error when user tries to deactivate themselves', async () => {
                await expect(
                    adminService.deactivateUser(adminUser.id, adminUser.id),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── ACTIVATE USER ───────────────────────────────────────────────

        describe('activateUser', () => {
            it('should activate a deactivated user', async () => {
                const result = await adminService.activateUser(createdUser.id);

                expect(result).toBeDefined();
                expect(result.active).toBe(true);
            });

            it('should throw error when activating already active user', async () => {
                await expect(
                    adminService.activateUser(createdUser.id),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── FORGOT PASSWORD (Admin reset password) ──────────────────────

        describe('forgotPassword', () => {
            it('should reset user password successfully', async () => {
                const dto: ForgotPasswordRequestDto = {
                    id: createdUser.id,
                    password: 'NewResetPassword123!',
                };

                const result = await adminService.forgotPassword(dto);

                expect(result).toBeDefined();
                expect(result.id).toBe(createdUser.id);
                // Password has been changed; verified via getUserByUsername.
            });

            it('should throw error when resetting password for non-existent user', async () => {
                const dto: ForgotPasswordRequestDto = {
                    id: '00000000-0000-0000-0000-000000000000',
                    password: 'SomePassword123!',
                };

                await expect(adminService.forgotPassword(dto)).rejects.toThrow(CustomException);
            });
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 3. USERS OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════

    describe('3. Users Operations', () => {

        // ─── GET USER BY ID ──────────────────────────────────────────────

        describe('getUserById', () => {
            it('should get user by id (without password)', async () => {
                const result = await usersService.getUserById(adminUser.id, false);

                expect(result).toBeDefined();
                expect(result.id).toBe(adminUser.id);
                expect(result.username).toBe('admin_test');
                expect((result as any).password).toBeUndefined();
            });

            it('should get user by id (with password)', async () => {
                const result = await usersService.getUserById(adminUser.id, true) as UserResponseWithPasswordDto;

                expect(result).toBeDefined();
                expect(result.id).toBe(adminUser.id);
                expect(result.password).toBeDefined();
                expect(result.password).not.toBe('AdminPassword123!'); // Password must be hashed.
            });

            it('should throw error when user id does not exist', async () => {
                await expect(
                    usersService.getUserById('00000000-0000-0000-0000-000000000000', false),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── GET USER BY USERNAME ────────────────────────────────────────

        describe('getUserByUsername', () => {
            it('should get user by username (without password)', async () => {
                const result = await usersService.getUserByUsername('admin_test', false);

                expect(result).toBeDefined();
                expect(result.username).toBe('admin_test');
                expect(result.firstName).toBe('Admin');
                expect((result as any).password).toBeUndefined();
            });

            it('should get user by username (with password)', async () => {
                const result = await usersService.getUserByUsername('cashier_test', true) as UserResponseWithPasswordDto;

                expect(result).toBeDefined();
                expect(result.username).toBe('cashier_test');
                expect(result.password).toBeDefined();
            });

            it('should throw error when username does not exist', async () => {
                await expect(
                    usersService.getUserByUsername('non_existent_user', false),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── GET LIST OF USERS ───────────────────────────────────────────

        describe('getListOfUsers', () => {
            it('should get paginated list of users', async () => {
                const result: GetListOfUsersResponseDto = await usersService.getListOfUsers({
                    page: 1,
                    limit: 10,
                });

                expect(result).toBeDefined();
                expect(result.page).toBe(1);
                expect(result.limit).toBe(10);
                expect(result.total).toBeGreaterThanOrEqual(3); // admin + cashier + manager.
                expect(result.users).toBeInstanceOf(Array);
                expect(result.users.length).toBeGreaterThanOrEqual(3);
            });

            it('should filter users by role', async () => {
                const result = await usersService.getListOfUsers({
                    page: 1,
                    limit: 10,
                    roles: [Role.ADMIN],
                });

                expect(result.total).toBeGreaterThanOrEqual(1);
                result.users.forEach((user: UserResponseDto) => {
                    expect(user.roles).toContain(Role.ADMIN);
                });
            });

            it('should search users by username', async () => {
                const result = await usersService.getListOfUsers({
                    page: 1,
                    limit: 10,
                    search: 'cashier',
                    searchBy: 'username',
                });

                expect(result.total).toBeGreaterThanOrEqual(1);
                result.users.forEach((user: UserResponseDto) => {
                    expect(user.username.toLowerCase()).toContain('cashier');
                });
            });

            it('should filter users by active status', async () => {
                const result = await usersService.getListOfUsers({
                    page: 1,
                    limit: 10,
                    active: 'true',
                });

                expect(result.total).toBeGreaterThanOrEqual(1);
                result.users.forEach((user: UserResponseDto) => {
                    expect(user.active).toBe(true);
                });
            });

            it('should sort users by createdAt DESC', async () => {
                const result = await usersService.getListOfUsers({
                    page: 1,
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                });

                expect(result.users.length).toBeGreaterThanOrEqual(2);
                for (let i = 0; i < result.users.length - 1; i++) {
                    const currentDate = new Date(result.users[i].createdAt).getTime();
                    const nextDate = new Date(result.users[i + 1].createdAt).getTime();
                    expect(currentDate).toBeGreaterThanOrEqual(nextDate);
                }
            });

            it('should handle pagination correctly', async () => {
                const result = await usersService.getListOfUsers({
                    page: 1,
                    limit: 1,
                });

                expect(result.users).toHaveLength(1);
                expect(result.total).toBeGreaterThanOrEqual(3);
            });
        });

        // ─── USER CHANGE PASSWORD ────────────────────────────────────────

        describe('userChangePassword', () => {
            it('should change password successfully', async () => {
                // cashier_test's password was previously reset by admin to 'NewResetPassword123!'.
                const dto: UserChangePasswordRequestDto = {
                    currentPassword: 'NewResetPassword123!',
                    newPassword: 'FinalPassword123!',
                    confirmPassword: 'FinalPassword123!',
                };

                const result = await usersService.userChangePassword(createdUser.id, dto);

                expect(result).toBe(true);
            });

            it('should throw error with incorrect current password', async () => {
                const dto: UserChangePasswordRequestDto = {
                    currentPassword: 'WrongPassword123!',
                    newPassword: 'AnotherPassword123!',
                    confirmPassword: 'AnotherPassword123!',
                };

                await expect(
                    usersService.userChangePassword(createdUser.id, dto),
                ).rejects.toThrow(CustomException);
            });

            it('should throw error when new password and confirm password do not match', async () => {
                const dto: UserChangePasswordRequestDto = {
                    currentPassword: 'FinalPassword123!',
                    newPassword: 'MismatchPassword1!',
                    confirmPassword: 'MismatchPassword2!',
                };

                await expect(
                    usersService.userChangePassword(createdUser.id, dto),
                ).rejects.toThrow(CustomException);
            });
        });

        // ─── SEARCH USERS ────────────────────────────────────────────────

        describe('searchUsers', () => {
            it('should search users by username keyword', async () => {
                const result: GetListOfUsersForSearchResponseDto = await usersService.searchUsers('test');

                expect(result).toBeDefined();
                expect(result.total).toBeGreaterThanOrEqual(1);
                expect(result.users).toBeInstanceOf(Array);
                result.users.forEach((user: { id: string; username: string }) => {
                    expect(user.id).toBeDefined();
                    expect(user.username).toBeDefined();
                });
            });

            it('should return empty when no users match', async () => {
                const result = await usersService.searchUsers('zzz_nonexistent_zzz');

                expect(result.total).toBe(0);
                expect(result.users).toHaveLength(0);
            });
        });
    });
});
