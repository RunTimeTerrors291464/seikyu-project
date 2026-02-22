import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import microservices.

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportInvoiceEntity } from './entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from './entities/importInvocieProducts.entity';

// Import repositories.
import { ImportInvoiceRepository } from './repositories/importInvoice.repository';

// Import invoice helper module.
import { InvoiceHelperModule } from '../invoiceHelper/invoiceHelper.module';

// Import controllers.
import { ImportInvoiceController } from './controllers/importInvoice.controller';

// Import services.
import { ImportInvoiceService } from './services/importInvoice.service';

// Import mappers.
import { ImportInvoicesMapper } from '@app/common/mappers/invoices/importInvoices.mapper';

@Module({
    imports: [
        InvoiceHelperModule,

        TypeOrmModule.forFeature([
            ImportInvoiceEntity,
            ImportInvoiceProductsEntity,
        ]),
    ],
    controllers: [
        ImportInvoiceController,
    ],
    providers: [
        ImportInvoiceRepository,
        ImportInvoicesMapper,
        ImportInvoiceService,
    ],
    exports: [
        ImportInvoiceRepository,
        ImportInvoicesMapper,
        ImportInvoiceService,
    ],
})
export class ImportInvoicesModule { }
