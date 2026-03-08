import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import entities.
import { LogsEntity } from './entities/logs.entity';

// Import auth module.
import { AuthModule } from '../auth/auth.module';

// Import controllers.
import { LogsController } from './controllers/logs.controller';

// Import services.
import { LogsService } from './services/logs.service';

// Import repositories.
import { LogsRepository } from './repositories/logs.repository';

@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([
            LogsEntity,
        ]),
    ],
    controllers: [
        LogsController,
    ],
    providers: [
        LogsService,
        LogsRepository,
    ],
    exports: [
        LogsService,
    ]
})
export class LogsModule { }
