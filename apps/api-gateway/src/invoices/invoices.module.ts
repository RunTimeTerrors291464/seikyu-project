import { Module } from '@nestjs/common';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';
import { StockAdjustmentsModule } from './stockAdjustments/stockAdjustments.module';

@Module({
  imports: [
    ImportInvoicesModule,
    StockAdjustmentsModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
