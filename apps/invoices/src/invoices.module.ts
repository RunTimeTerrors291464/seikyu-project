import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

// Import the postgres module and the application's entities.
import { PostgresModule } from '@app/services';
import { ImportInvoiceEntity } from './importInvoices/entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from './importInvoices/entities/importInvocieProducts.entity';

import { StockAdjustmentEntity } from './stockAdjustments/entities/stockAdjustment.entity';
import { StockAdjustmentProductsEntity } from './stockAdjustments/entities/stockAdjustmentProducts.entity';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';
import { StockAdjustmentsModule } from './stockAdjustments/stockAdjustments.module';


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
        StockAdjustmentEntity,
        StockAdjustmentProductsEntity,
      ],
    }),

    ImportInvoicesModule,
    StockAdjustmentsModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
