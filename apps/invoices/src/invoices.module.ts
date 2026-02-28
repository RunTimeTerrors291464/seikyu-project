import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

// Import the postgres module and the application's entities.
import { PostgresModule } from '@app/services';
import { ImportInvoiceEntity } from './importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from './importInvoices/entities/importInvocieProducts.entity';
import { ReturnImportInvoiceEntity } from './returnImportInvoices/entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from './returnImportInvoices/entities/returnImportInvoiceProducts.entity';
import { SellingInvoiceEntity } from './sellingInvoices/entities/sellingInvoices.entity';
import { SellingInvoiceProductsEntity } from './sellingInvoices/entities/sellingInvoiceProducts.entity';
import { ReturnSellingInvoiceEntity } from './returnSellingInvoices/entities/returnSellingInvoices.entity';
import { ReturnSellingInvoiceProductsEntity } from './returnSellingInvoices/entities/returnSellingInvoiceProducts.entity';
import { StockAdjustmentInvoiceEntity } from './stockAdjustmentInvoices/entities/stockAdjustmentInvoices.entity';
import { StockAdjustmentInvoiceProductsEntity } from './stockAdjustmentInvoices/entities/stockAdjustmentInvoiceProducts.entity';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';
import { ReturnImportInvoicesModule } from './returnImportInvoices/returnImportInvoices.module';
import { SellingInvoicesModule } from './sellingInvoices/sellingInvoices.module';
import { ReturnSellingInvoicesModule } from './returnSellingInvoices/returnSellingInvoices.module';
import { InvoiceHelperModule } from './invoiceHelper/invoiceHelper.module';
import { StockAdjustmentInvoicesModule } from './stockAdjustmentInvoices/stockAdjustmentInvoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    PostgresModule.forRoot({
      databaseApplication: 'invoices',
      entities: [
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
      ],
    }),

    ImportInvoicesModule,
    ReturnImportInvoicesModule,
    SellingInvoicesModule,
    ReturnSellingInvoicesModule,
    InvoiceHelperModule,
    StockAdjustmentInvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
