import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

// Import auth module to provide JwtAuthGuard dependencies.
import { AuthModule } from '../../auth/auth.module';

// Import logs module.
import { LogsModule } from '../../logs/logs.module';

// Import controllers.
import { ImportInvoicesController } from './importInvoices.controller';

@Module({
    imports: [
        AuthModule,
        LogsModule,
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
        ImportInvoicesController,
    ],
    providers: [],
    exports: []
})
export class ImportInvoicesModule { }
