import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Import auth module to provide JwtAuthGuard dependencies.
import { AuthModule } from '../auth/auth.module';

// Import users controllers.
import { AdminController } from './users/admin.controller';
import { FirstAdminAccountController } from './users/first-admin-account.controller';
import { UsersController } from './users/users.controller';

import { ProductUnitsController } from './products/productUnits.controller';
import { ProductsController } from './products/products.controller';

@Module({
    imports: [
        AuthModule,
        ClientsModule.registerAsync([
            {
                name: 'PLATFORM_SERVICE',
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: configService.getOrThrow<string>('PLATFORM_SERVICE_HOST'),
                        port: configService.getOrThrow<number>('PLATFORM_SERVICE_PORT'),
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [
        AdminController,
        FirstAdminAccountController,
        UsersController,
        ProductUnitsController,
        ProductsController,
    ],
    providers: [],
    exports: []
})
export class PlatformModule { }
