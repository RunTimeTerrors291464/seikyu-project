import { forwardRef, Module } from '@nestjs/common';

// Import the database module.
import { PostgresModule } from '@libs/services/postgres.module';

// Import modules.
import { AuthModule } from '@src/auth/auth.module';

// Import mappers.
import { UsersMapper } from '@libs/common/mappers/users.mapper';

// Import entities.
import { UsersEntity } from './entities/users.entity';

// Import repositories.
import { UsersRepository } from './repositories/users.repository';

// Import services.
import { UsersService } from './services/users.service';

// Import controllers.
import { AdminController } from './controllers/admin.controller';
import { FirstAdminAccountController } from './controllers/first-admin-account.controller';
import { UsersController } from './controllers/users.controller';


@Module({
    imports: [
        PostgresModule.forFeature([UsersEntity]),
        forwardRef(() => AuthModule),
    ],
    controllers: [
        AdminController,
        FirstAdminAccountController,
        UsersController,
    ],
    providers: [
        UsersMapper,
        UsersRepository,
        UsersService,
    ],
    exports: [
        UsersService,
        UsersRepository,
    ],
})
export class UsersModule {}
