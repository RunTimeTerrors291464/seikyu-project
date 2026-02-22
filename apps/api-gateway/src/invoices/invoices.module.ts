import { Module } from '@nestjs/common';

// Import modules.
import { ImportInvoicesModule } from './importInvoices/importInvoices.module';

@Module({
  imports: [
    ImportInvoicesModule,
  ],
  controllers: [],
  providers: [],
})
export class InvoicesModule { }
