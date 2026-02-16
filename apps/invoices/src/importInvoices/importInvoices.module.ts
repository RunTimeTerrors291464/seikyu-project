import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import microservices.
import { ClientsModule, Transport } from '@nestjs/microservices';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportInvoiceEntity } from './entities/importInvoices.entity';
import { ImportInvoiceProductsEntity } from './entities/importInvocieProducts.entity';

// Import repositories.
import { ImportInvoiceRepository } from './repositories/importInvoice.repository';
import { InvoiceHelperRepository } from './repositories/invoiceHelper.repository';

// Import controllers.
import { ImportInvoiceController } from './controllers/importInvoice.controller';

// Import services.
import { ImportInvoiceService } from './services/importInvoice.service';

// Import mappers.
import { ImportInvoicesMapper } from '@app/common/mappers/invoices/importInvoices.mapper';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'PLATFORM_SERVICE',
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: configService.getOrThrow<string>('PLATFORM_SERVICE_HOST'),
                        port: configService.getOrThrow<number>('PLATFORM_SERVICE_PORT'),
                    },
                }),
                inject: [ConfigService],
            },
        ]),

        TypeOrmModule.forFeature([
            ImportInvoiceEntity,
            ImportInvoiceProductsEntity,
        ]),
    ],
    controllers: [
        ImportInvoiceController,
    ],
    providers: [
        ImportInvoiceRepository,
        InvoiceHelperRepository,
        ImportInvoicesMapper,
        ImportInvoiceService,
    ],
    exports: [
        ImportInvoiceRepository,
        InvoiceHelperRepository,
        ImportInvoicesMapper,
        ImportInvoiceService,
    ],
})
export class ImportInvoicesModule { }
