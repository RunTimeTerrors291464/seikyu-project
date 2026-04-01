import { Module } from '@nestjs/common';

// Import the database module.
import { PostgresModule } from '@libs/services/postgres.module';

// Import the redis module.
import { RedisModule } from '@libs/services/redis.module';

// Import modules.
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductUnitsModule } from './productUnits/productUnits.module';

@Module({
  imports: [

    // Import third party modules.
    PostgresModule.forRoot(),

    RedisModule.forRoot({ appPrefix: 'seikyu' }),

    // Import modules.
    UsersModule,
    AuthModule,
    ProductsModule,
    DashboardModule,
    ProductUnitsModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
