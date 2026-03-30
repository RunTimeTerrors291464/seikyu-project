import * as fs from 'fs';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class PostgresModule {
    static forRoot(): DynamicModule {
        return {
            module: PostgresModule,
            global: true,
            imports: [

                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),

                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => {
                        const useSSL = configService.get('DB_SSL') === 'true';
                        const sslOptions = useSSL ? {
                            rejectUnauthorized: true,
                            ca: fs.readFileSync(configService.get('DB_SSL_CERT') || '/certs/global-bundle.pem').toString()
                        } : false;

                        return {
                            type: 'postgres',
                            host: configService.getOrThrow('DB_HOST'),
                            port: configService.getOrThrow('DB_PORT'),
                            username: configService.getOrThrow('DB_USERNAME'),
                            password: configService.getOrThrow('DB_PASSWORD'),
                            database: configService.getOrThrow('DB_DATABASE'),
                            autoLoadEntities: true,
                            synchronize: false,
                            logging: configService.get('DB_LOGGING') === 'true',
                            ssl: sslOptions,
                            extra: {
                                max: parseInt(configService.get('DB_POOL_MAX') || '20', 10),
                                min: parseInt(configService.get('DB_POOL_MIN') || '5', 10),
                                idleTimeoutMillis: parseInt(configService.get('DB_POOL_IDLE_TIMEOUT') || '30000', 10),
                                connectionTimeoutMillis: parseInt(
                                    configService.get('DB_POOL_CONNECTION_TIMEOUT') || '5000',
                                    10,
                                ),
                            },
                        };
                    },
                    inject: [ConfigService],
                }),
            ],
            exports: [TypeOrmModule],
        };
    }

    static forFeature(entities: EntityClassOrSchema[]): DynamicModule {
        return {
            module: PostgresModule,
            imports: [TypeOrmModule.forFeature(entities)],
            exports: [TypeOrmModule],
        };
    }
}
