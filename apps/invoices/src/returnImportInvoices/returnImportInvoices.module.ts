import { Module } from '@nestjs/common';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnImportInvoiceEntity } from './entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from './entities/returnImportInvoiceProducts.entity';

// Import modules.
import { ImportInvoicesModule } from '../importInvoices/importInvoices.module';
import { InvoiceHelperModule } from '../invoiceHelper/invoiceHelper.module';

// Import repositories.
import { ReturnImportInvoiceRepository } from './repositories/returnImportInvoice.repository';

// Import controllers.
import { ReturnImportInvoiceController } from './controllers/returnImportInvoice.controller';

// Import services.
import { ReturnImportInvoiceService } from './services/returnImportInvoice.service';

// Import mappers.
import { ReturnImportInvoicesMapper } from '@app/common/mappers/invoices/returnImportInvoices.mapper';

@Module({
    imports: [
        InvoiceHelperModule,
        ImportInvoicesModule, 

        TypeOrmModule.forFeature([
            ReturnImportInvoiceEntity,
            ReturnImportInvoiceProductsEntity,
        ]),
    ],
    controllers: [
        ReturnImportInvoiceController,
    ],
    providers: [
        ReturnImportInvoiceRepository,
        ReturnImportInvoicesMapper,
        ReturnImportInvoiceService,
    ],
    exports: [
        ReturnImportInvoiceRepository,
        ReturnImportInvoicesMapper,
        ReturnImportInvoiceService,
    ],
})
export class ReturnImportInvoicesModule { }
