import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

// Import entities.
import { StockAdjustmentEntity } from './entities/stockAdjustment.entity';
import { StockAdjustmentProductsEntity } from './entities/stockAdjustmentProducts.entity';

// Import controllers.
import { StockAdjustmentController } from './controllers/stockAdjustment.controller';

// Import services.
import { StockAdjustmentService } from './services/stockAdjustment.service';

// Import repositories.
import { StockAdjustmentRepository } from './repositories/stockAdjustment.repository';
import { InvoiceHelperRepository } from '../importInvoices/repositories/invoiceHelper.repository';

// Import modules.
import { ImportInvoicesModule } from '../importInvoices/importInvoices.module';

// Import mappers.
import { StockAdjustmentsMapper } from '@app/common/mappers/invoices/stockAdjustments.mapper';

@Module({
    imports: [
        ImportInvoicesModule,

        TypeOrmModule.forFeature([
            StockAdjustmentEntity,
            StockAdjustmentProductsEntity,
        ]),

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
        StockAdjustmentController
    ],
    providers: [
        StockAdjustmentService,
        StockAdjustmentRepository,
        InvoiceHelperRepository,
        StockAdjustmentsMapper,
    ],
})
export class StockAdjustmentsModule { }
