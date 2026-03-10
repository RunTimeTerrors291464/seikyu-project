import { NestFactory } from '@nestjs/core';
import { PlatformModule } from './platform.module';
import { Logger, ValidationPipe } from '@nestjs/common';

// Import config service.
import { ConfigService } from '@nestjs/config';

// Import microservice options.
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

// Import custom RPC exception filter.
import { CustomRpcExceptionFilter } from '@app/common/error-exceptions/rpcExceptionFilter';

async function bootstrap() {
    const app = await NestFactory.create(PlatformModule);
    const configService = app.get(ConfigService);

    // Set up RPC exception filter for HTTP context.
    app.useGlobalFilters(new CustomRpcExceptionFilter());

    // Set up validation pipe.
    app.useGlobalPipes(new ValidationPipe());

    const host = configService.getOrThrow<string>('PLATFORM_SERVICE_HOST');
    const port = configService.getOrThrow<number>('PLATFORM_SERVICE_PORT');

    // Set up TCP microservice with inheritAppConfig to share global filters.
    app.connectMicroservice<MicroserviceOptions>(
        {
            transport: Transport.TCP,
            options: {
                host,
                port,
            }
        },
        { inheritAppConfig: true }
    );

    // Initialize app to trigger lifecycle hooks.
    await app.init();

    // Start all microservices.
    await app.startAllMicroservices();
    Logger.log(`Platform service is running on: http://${host}:${port}...`);
}

bootstrap();