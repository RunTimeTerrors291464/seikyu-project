import { NestFactory } from '@nestjs/core';

// Import nestjs common.
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import class-validator.
import { ValidationError } from 'class-validator';

// Import swagger.
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Import the app module.
import { AppModule } from './app.module';

// Import the custom exception filter.
import { CustomExceptionFilter } from '@libs/common/error-exceptions/customExceptionFilter';
import { formatValidationErrors } from '@libs/common/error-exceptions/validationConstraint.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS.
  const acceptedOrigins: string[] = configService
    .get<string>('ACCEPTED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: acceptedOrigins.length ? acceptedOrigins : '*',
    credentials: true,
  });

  // Use the custom exception filter.
  app.useGlobalFilters(new CustomExceptionFilter());

  // Enable validation pipe globally.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: formatValidationErrors(errors),
        });
      },
    }),
  );

  // Swagger configuration.
  const config = new DocumentBuilder()
    .setTitle('Seikyu API')
    .setDescription('Seikyu Project v2 API documentation')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const host = configService.get<string>('APP_HOST', '0.0.0.0');
  const port = configService.get<number>('APP_PORT', 3000);
  await app.listen(port, host);

  Logger.log(`Server is running on: http://${host}:${port}`);
  Logger.log(`Swagger documentation: http://${host}:${port}/api/docs`);
}
bootstrap();
