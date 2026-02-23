import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

// Import the postgres module and the application's entities.
import { PostgresModule } from '@app/services';
import { ImportInvoiceEntity } from './importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from './importInvoices/entities/importInvocieProducts.entity';
import { ReturnImportInvoiceEntity } from './returnImportInvoices/entities/returnImportInvoices.entity';
import { ReturnImportInvoiceProductsEntity } from './returnImportInvoices/entities/returnImportInvoiceProducts.entity';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';
import { ReturnImportInvoicesModule } from './returnImportInvoices/returnImportInvoices.module';
import { InvoiceHelperModule } from './invoiceHelper/invoiceHelper.module';

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
      ],
    }),

    ImportInvoicesModule,
    ReturnImportInvoicesModule,
    InvoiceHelperModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
