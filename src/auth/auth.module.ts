import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

// Import modules.
import { PostgresModule } from '@libs/services/postgres.module';
import { UsersModule } from '@src/users/users.module';

// Import entities.
import { RefreshTokenEntity } from './entities/refreshToken.entity';

// Import controllers.
import { AuthController } from './controllers/auth.controller';

// Import repositories.
import { AuthRepository } from './repositories/auth.repository';

// Import services.
import { AuthService } from './services/auth.service';
import { AccessTokenService } from './services/accessToken.service';
import { EncryptionService } from './services/encryption.service';
import { CleanUpAuthService } from './services/cleanUpAuth.service';

// Import guards and strategies.
import { JwtStrategy } from './guards/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
    imports: [
        // Import third party modules.
        PassportModule.register({ defaultStrategy: 'jwt' }),

        ScheduleModule.forRoot(),

        JwtModule.register({}),

        PostgresModule.forFeature([RefreshTokenEntity]),

        // Import modules.
        forwardRef(() => UsersModule),
    ],
    controllers: [
        AuthController,
    ],
    providers: [
        AuthRepository,

        AuthService,
        AccessTokenService,
        EncryptionService,
        CleanUpAuthService,
        
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
    ],
    exports: [
        AuthRepository,
        AccessTokenService,
        JwtAuthGuard,
        RolesGuard,
    ],
})
export class AuthModule { }
