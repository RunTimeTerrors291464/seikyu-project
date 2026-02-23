import { Module } from '@nestjs/common';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';
import { ReturnImportInvoicesModule } from './returnImportInvoices/returnImportInvoices.module';

@Module({
  imports: [
    ImportInvoicesModule,
    ReturnImportInvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
