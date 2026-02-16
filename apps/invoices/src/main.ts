import { NestFactory } from '@nestjs/core';
import { InvoicesModule } from './invoices.module';
import { Logger, ValidationPipe } from '@nestjs/common';

// Import config service.
import { ConfigService } from '@nestjs/config';

// Import microservice options.
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

// Import custom RPC exception filter.
import { CustomRpcExceptionFilter } from '@app/common/error-exceptions/rpcExceptionFilter';

async function bootstrap() {
  const app = await NestFactory.create(InvoicesModule);
  const configService = app.get(ConfigService);

  // Set up RPC exception filter for HTTP context.
  app.useGlobalFilters(new CustomRpcExceptionFilter());

  // Set up validation pipe.
  app.useGlobalPipes(new ValidationPipe());

  const host = configService.getOrThrow<string>('INVOICES_SERVICE_HOST');
  const port = configService.getOrThrow<number>('INVOICES_SERVICE_PORT');

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

  // Start all microservices.
  await app.startAllMicroservices();
  Logger.log(`Invoices service is running on: http://${host}:${port}...`);
}

bootstrap();