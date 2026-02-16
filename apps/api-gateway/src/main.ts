import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { Logger, ValidationPipe } from '@nestjs/common';

// Import swagger.
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Import config service.
import { ConfigService } from '@nestjs/config';

// Import custom error exception filter.
import { CustomExceptionFilter } from '@app/common/error-exceptions/customExceptionFilter';

async function bootstrap() {
    const app = await NestFactory.create(ApiGatewayModule);
    const configService = app.get(ConfigService);

    // Enable CORS.
    app.enableCors();

    // Use the custom exception filter.
    app.useGlobalFilters(new CustomExceptionFilter());

    // Enable validation pipe globally
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // Swagger Configuration.
    const config = new DocumentBuilder()
        .setTitle('Invoice System API')
        .setDescription('Microservice API Gateway for Invoice Management System')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            }
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const host = configService.getOrThrow<string>('API_GATEWAY_HOST');
    const port = configService.getOrThrow<number>('API_GATEWAY_PORT');
    await app.listen(port, host);

    Logger.log(`API Gateway is running on: http://${host}:${port}...`);
    Logger.log(`Swagger documentation: http://${host}:${port}/api/docs...`);
}

bootstrap();