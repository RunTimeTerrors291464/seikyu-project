import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import microservices.
import { ClientsModule, Transport } from '@nestjs/microservices';

// Import services.
import { InvoiceHelperService } from './invoiceHelper.service';

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
    ],
    controllers: [],
    providers: [
        InvoiceHelperService,
    ],
    exports: [
        InvoiceHelperService,
    ],
})
export class InvoiceHelperModule { }
