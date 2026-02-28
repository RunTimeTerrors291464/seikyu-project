import { Module } from '@nestjs/common';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';
import { ReturnImportInvoicesModule } from './returnImportInvoices/returnImportInvoices.module';
import { SellingInvoicesModule } from './sellingInvoices/sellingInvoices.module';
import { ReturnSellingInvoicesModule } from './returnSellingInvoices/returnSellingInvoices.module';

@Module({
  imports: [
    ImportInvoicesModule,
    ReturnImportInvoicesModule,
    SellingInvoicesModule,
    ReturnSellingInvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
