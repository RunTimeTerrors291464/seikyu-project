import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

// Import the postgres module and the application's entities.
import { PostgresModule } from '@app/services';
import { RefreshTokenEntity } from './auth/entities/refreshToken.entity';

// Import modules.
import { AuthModule } from './auth/auth.module';
import { PlatformModule } from './platform/platform.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PostgresModule.forRoot({
      databaseApplication: 'api_gateway',
      entities: [RefreshTokenEntity],
    }),

    AuthModule,
    PlatformModule,
    InvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class ApiGatewayModule { }
