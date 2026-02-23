import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Import auth module to provide JwtAuthGuard dependencies.
import { AuthModule } from '../../auth/auth.module';

// Import controllers.
import { ReturnImportInvoicesController } from './returnImportInvoices.controller';

@Module({
    imports: [
        AuthModule,
        ClientsModule.registerAsync([
            {
                name: 'INVOICES_SERVICE',
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.TCP,
                    options: {
                        host: configService.getOrThrow<string>('INVOICES_SERVICE_HOST'),
                        port: configService.getOrThrow<number>('INVOICES_SERVICE_PORT'),
                    },
                }),
                inject: [ConfigService],
            },
        ]),
    ],
    controllers: [
        ReturnImportInvoicesController,
    ],
    providers: [],
    exports: []
})
export class ReturnImportInvoicesModule { }
