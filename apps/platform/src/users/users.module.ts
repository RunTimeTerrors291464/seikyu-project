import { Module } from '@nestjs/common';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserRoleEntity } from './entities/userRole.entity';

// Import controllers.
import { AdminController } from './controllers/admin.controller';
import { UsersController } from './controllers/users.controller';
import { FirstAdminAccountController } from './controllers/first-admin-account.controller';

// Import services.
import { AdminService } from './services/admin.service';
import { UsersService } from './services/users.service';
import { FirstAdminAccountService } from './services/first-admin-account.service';

// Import repositories.
import { AdminRepository } from './repositories/admin.repository';
import { UsersRepository } from './repositories/users.repository';

// Import mappers.
import { UsersMapper } from '@app/common/mappers/platform/users.mapper';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            UserRoleEntity,
        ]),
    ],
    controllers: [
        AdminController,
        UsersController,
        FirstAdminAccountController
    ],
    providers: [
        AdminService,
        UsersService,
        FirstAdminAccountService,
        AdminRepository,
        UsersRepository,
        UsersMapper
    ],
    exports: [
        UsersRepository
    ]
        
})
export class UsersModule { }
