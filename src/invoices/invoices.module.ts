import { Module } from '@nestjs/common';

// Import the database module.
import { PostgresModule } from '@libs/services/postgres.module';
import { ProductsModule } from '@src/products/products.module';
import { AuthModule } from '@src/auth/auth.module';

// Import mappers.
import { ImportInvoicesMapper } from '@libs/common/mappers/importInvoices.mapper';
import { SellingInvoicesMapper } from '@libs/common/mappers/sellingInvoices.mapper';
import { StockAdjustmentInvoicesMapper } from '@libs/common/mappers/stockAdjustmentInvoices.mapper';

// Import entities — import invoices.
import { ImportInvoiceEntity } from './importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from './importInvoices/entities/importInvocieProducts.entity';
import { ReturnImportInvoiceEntity } from './importInvoices/entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from './importInvoices/entities/returnImportInvoiceProducts.entity';

// Import entities — selling invoices.
import { SellingInvoiceEntity } from './sellingInvoices/entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from './sellingInvoices/entities/sellingInvoiceProducts.entity';
import { ReturnSellingInvoiceEntity } from './sellingInvoices/entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from './sellingInvoices/entities/returnSellingInvoiceProducts.entity';

// Import entities — stock adjustment invoices.
import { StockAdjustmentInvoiceEntity } from './stockAdjustmentInvoice/entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from './stockAdjustmentInvoice/entities/stockAdjustmentInvoiceProducts.entity';

// Import repositories — import invoices.
import { ImportInvoiceRepository } from './importInvoices/repositories/importInvoice.repository';
import { ReturnImportInvoiceRepository } from './importInvoices/repositories/returnImportInvoice.repository';

// Import repositories — selling invoices.
import { SellingInvoiceRepository } from './sellingInvoices/repositories/sellingInvoice.repository';
import { ReturnSellingInvoiceRepository } from './sellingInvoices/repositories/returnSellingInvoice.repository';

// Import repositories — stock adjustment invoices.
import { StockAdjustmentInvoiceRepository } from './stockAdjustmentInvoice/repositories/stockAdjustmentInvoice.repository';

// Import services — import invoices.
import { ImportInvoiceService } from './importInvoices/services/importInvoice.service';
import { ReturnImportInvoiceService } from './importInvoices/services/returnImportInvoice.service';

// Import services — selling invoices.
import { SellingInvoiceService } from './sellingInvoices/services/sellingInvoice.service';
import { ReturnSellingInvoiceService } from './sellingInvoices/services/returnSellingInvoice.service';

// Import services — stock adjustment invoices.
import { StockAdjustmentInvoiceService } from './stockAdjustmentInvoice/services/stockAdjustmentInvoice.service';

// Import controllers — import invoices.
import { ImportInvoiceController } from './importInvoices/controllers/importInvoice.controller';
import { ReturnImportInvoiceController } from './importInvoices/controllers/returnImportInvoice.controller';

// Import controllers — selling invoices.
import { SellingInvoiceController } from './sellingInvoices/controllers/sellingInvoice.controller';
import { ReturnSellingInvoiceController } from './sellingInvoices/controllers/returnSellingInvoice.controller';

// Import controllers — stock adjustment invoices.
import { StockAdjustmentInvoiceController } from './stockAdjustmentInvoice/controllers/stockAdjustmentInvoice.controller';

@Module({
    imports: [
        PostgresModule.forFeature([
            ImportInvoiceEntity,
            ImportInvoiceProductsEntity,
            ReturnImportInvoiceEntity,
            ReturnImportInvoiceProductsEntity,
            SellingInvoiceEntity,
            SellingInvoiceProductsEntity,
            ReturnSellingInvoiceEntity,
            ReturnSellingInvoiceProductsEntity,
            StockAdjustmentInvoiceEntity,
            StockAdjustmentInvoiceProductsEntity,
        ]),

        ProductsModule,
        AuthModule,
    ],
    controllers: [
        ImportInvoiceController,
        ReturnImportInvoiceController,
        SellingInvoiceController,
        ReturnSellingInvoiceController,
        StockAdjustmentInvoiceController,
    ],
    providers: [
        ImportInvoicesMapper,
        SellingInvoicesMapper,
        StockAdjustmentInvoicesMapper,

        ImportInvoiceRepository,
        ReturnImportInvoiceRepository,
        SellingInvoiceRepository,
        ReturnSellingInvoiceRepository,
        StockAdjustmentInvoiceRepository,

        ImportInvoiceService,
        ReturnImportInvoiceService,
        SellingInvoiceService,
        ReturnSellingInvoiceService,
        StockAdjustmentInvoiceService,
    ],
    exports: [
        ImportInvoiceRepository,
        ReturnImportInvoiceRepository,
        SellingInvoiceRepository,
        ReturnSellingInvoiceRepository,
        StockAdjustmentInvoiceRepository,

        ImportInvoiceService,
        ReturnImportInvoiceService,
        SellingInvoiceService,
        ReturnSellingInvoiceService,
        StockAdjustmentInvoiceService,
    ],
})
export class InvoicesModule { }
