import { Module } from '@nestjs/common';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnSellingInvoiceEntity } from './entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from './entities/returnSellingInvoiceProducts.entity';

// Import modules.
import { SellingInvoicesModule } from '../sellingInvoices/sellingInvoices.module';
import { InvoiceHelperModule } from '../invoiceHelper/invoiceHelper.module';

// Import repositories.
import { ReturnSellingInvoiceRepository } from './repositories/returnSellingInvoice.repository';

// Import controllers.
import { ReturnSellingInvoiceController } from './controllers/returnSellingInvoice.controller';

// Import services.
import { ReturnSellingInvoiceService } from './services/returnSellingInvoice.service';

// Import mappers.
import { ReturnSellingInvoicesMapper } from '@app/common/mappers/invoices/returnSellingInvoices.mapper';

@Module({
    imports: [
        InvoiceHelperModule,
        SellingInvoicesModule,

        TypeOrmModule.forFeature([
            ReturnSellingInvoiceEntity,
            ReturnSellingInvoiceProductsEntity,
        ]),
    ],
    controllers: [
        ReturnSellingInvoiceController,
    ],
    providers: [
        ReturnSellingInvoiceRepository,
        ReturnSellingInvoiceService,
        ReturnSellingInvoicesMapper,
    ],
    exports: [
        ReturnSellingInvoiceRepository,
        ReturnSellingInvoiceService,
        ReturnSellingInvoicesMapper,
    ],
})
export class ReturnSellingInvoicesModule { }
