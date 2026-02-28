import { Module } from '@nestjs/common';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustmentInvoiceEntity } from './entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from './entities/stockAdjustmentInvoiceProducts.entity';

// Import invoice helper module.
import { InvoiceHelperModule } from '../invoiceHelper/invoiceHelper.module';

// Import controllers.
import { StockAdjustmentInvoiceController } from './controllers/stockAdjustmentInvoice.controller';

// Import services.
import { StockAdjustmentInvoiceService } from './services/stockAdjustmentInvoice.service';

// Import repositories.
import { StockAdjustmentInvoiceRepository } from './repositories/stockAdjustmentInvoice.repository';

// Import mappers.
import { StockAdjustmentInvoicesMapper } from '@app/common/mappers/invoices/stockAdjustmentInvoices.mapper';

@Module({
    imports: [
        InvoiceHelperModule,

        TypeOrmModule.forFeature([
            StockAdjustmentInvoiceEntity,
            StockAdjustmentInvoiceProductsEntity,
        ]),
    ],
    controllers: [
        StockAdjustmentInvoiceController,
    ],
    providers: [
        StockAdjustmentInvoiceRepository,
        StockAdjustmentInvoicesMapper,
        StockAdjustmentInvoiceService,
    ],
    exports: [
        StockAdjustmentInvoiceRepository,
        StockAdjustmentInvoicesMapper,
        StockAdjustmentInvoiceService,
    ],
})
export class StockAdjustmentInvoicesModule { }
