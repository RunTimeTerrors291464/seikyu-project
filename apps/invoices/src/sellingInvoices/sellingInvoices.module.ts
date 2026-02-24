import { Module } from '@nestjs/common';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { SellingInvoiceEntity } from './entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from './entities/sellingInvoiceProducts.entity';

// Import repositories.
import { SellingInvoiceRepository } from './repositories/sellingInvoices.repository';

// Import invoice helper module.
import { InvoiceHelperModule } from '../invoiceHelper/invoiceHelper.module';

// Import controllers.
import { SellingInvoiceController } from './controllers/sellingInvoice.controller';

// Import services.
import { SellingInvoiceService } from './services/sellingInvoice.service';

// Import mappers.
import { SellingInvoicesMapper } from '@app/common/mappers/invoices/sellingInvoices.mapper';

@Module({
    imports: [
        InvoiceHelperModule,

        TypeOrmModule.forFeature([
            SellingInvoiceEntity,
            SellingInvoiceProductsEntity,
        ]),
    ],
    controllers: [
        SellingInvoiceController,
    ],
    providers: [
        SellingInvoiceRepository,
        SellingInvoiceService,
        SellingInvoicesMapper,
    ],
    exports: [
        SellingInvoiceService,
    ],
})
export class SellingInvoicesModule { }
