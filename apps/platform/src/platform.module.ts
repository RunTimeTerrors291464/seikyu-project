import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

// Import the postgres module and the application's entities.
import { PostgresModule } from '@app/services';

import { UserEntity } from './users/entities/user.entity';
import { UserRoleEntity } from './users/entities/userRole.entity';

import { ProductUnitsEntity } from './products/entities/productUnits.entity';
import { ProductNamesEntity } from './products/entities/productNames.entity';
import { ProductsEntity } from './products/entities/products.entity';
import { ProductUnitsHistoryEntity } from './products/entities/history/productUnitsHistory.entity';
import { ProductsHistoryEntity } from './products/entities/history/productsHistory.entity';
import { ProductStockHistoryEntity } from './products/entities/history/productStockHistory.entity';
import { ProductOverviewEntity } from './products/entities/productOverview.entity';

// Import users module.
import { UsersModule } from './users/users.module';

// Import products module.
import { ProductsModule } from './products/products.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        PostgresModule.forRoot({
            databaseApplication: 'platform',
            entities: [
                UserEntity,
                UserRoleEntity,
                ProductUnitsEntity,
                ProductNamesEntity,
                ProductsEntity,
                ProductUnitsHistoryEntity,
                ProductsHistoryEntity,
                ProductStockHistoryEntity,
                ProductOverviewEntity,
            ],
        }),

        UsersModule,
        ProductsModule,
    ],
    providers: [],
    exports: [],
})
export class PlatformModule { }
