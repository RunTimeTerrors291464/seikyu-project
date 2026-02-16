import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Import schedule module.
import { ScheduleModule } from '@nestjs/schedule';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from './entities/refreshToken.entity';

// Import redis module.
import { RedisModule } from '@app/services';

// Import jwt module.
import { JwtModule } from '@nestjs/jwt';

// Import controllers.
import { AuthController } from './controllers/auth.controller';

// Import services.
import { AuthService } from './services/auth.service';
import { AccessTokenService } from './services/accessToken.service';
import { CleanUpAuthService } from './services/cleanUpAuth.service';
import { EncryptionService } from './services/encryption.service';

// Import repositories.
import { RefreshTokenRepository } from './repositories/refreshToken.repository';

// Import guards and strategy.
import { JwtStrategy } from './guards/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';

// Import PassportModule.
import { PassportModule } from '@nestjs/passport';

@Module({
    imports: [
        ScheduleModule.forRoot(),

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

        TypeOrmModule.forFeature([
            RefreshTokenEntity,
        ]),

        RedisModule.forRoot({
            keyPrefix: 'api-gateway:auth:',
        }),

        JwtModule.register({}),
        PassportModule,
    ],
    controllers: [
        AuthController,
    ],
    providers: [
        AuthService,
        AccessTokenService,
        CleanUpAuthService,
        EncryptionService,
        RefreshTokenRepository,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
    ],
    exports: [
        AuthService,
        AccessTokenService,
        JwtAuthGuard,
        RolesGuard,
        AccessTokenService,
    ]
})
export class AuthModule { }
