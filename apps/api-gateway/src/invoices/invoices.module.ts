import { Module } from '@nestjs/common';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';
import { ReturnImportInvoicesModule } from './returnImportInvoices/returnImportInvoices.module';
import { SellingInvoicesModule } from './sellingInvoices/sellingInvoices.module';

@Module({
  imports: [
    ImportInvoicesModule,
    ReturnImportInvoicesModule,
    SellingInvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
