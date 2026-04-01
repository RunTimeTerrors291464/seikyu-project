import { Module } from '@nestjs/common';

// Import the database module.
import { PostgresModule } from '@libs/services/postgres.module';

// Import modules.
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

// Import mappers.
import { ProductUnitMapper } from '@libs/common/mappers/productUnit.mapper';

// Import entities.
import { ProductUnitsEntity } from './entities/productUnits.entity';
import { ProductUnitsHistoryEntity } from './entities/productUnitsHistory.entity';

// Import repositories.
import { ProductUnitsRepository } from './repositories/productUnits.repository';

// Import services.
import { ProductUnitsService } from './services/productUnits.service';

// Import controllers.
import { ProductUnitsController } from './controllers/productUnits.controller';

@Module({
    imports: [
        PostgresModule.forFeature([ProductUnitsEntity, ProductUnitsHistoryEntity]),
        AuthModule,
        UsersModule,
    ],
    controllers: [
        ProductUnitsController
    ],
    providers: [
        ProductUnitMapper,
        ProductUnitsRepository,
        ProductUnitsService,
    ],
    exports: [ProductUnitsService],
})
export class ProductUnitsModule { }
