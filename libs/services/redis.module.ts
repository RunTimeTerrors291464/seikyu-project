import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as RedisModuleIoRedis, getRedisConnectionToken } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export interface RedisModuleOptions {
    appPrefix: string;
}


export function getRedisServiceToken(namespace: string): string {
    return `REDIS_SERVICE_${namespace.toUpperCase()}`;
}

@Module({})
export class RedisModule {

    static forRoot(options: RedisModuleOptions): DynamicModule {
        return {
            module: RedisModule,
            global: true,
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),

                RedisModuleIoRedis.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => ({
                        type: 'single',
                        options: {
                            host: configService.getOrThrow<string>('REDIS_HOST'),
                            port: configService.getOrThrow<number>('REDIS_PORT'),
                            password: configService.get<string>('REDIS_PASSWORD'),
                            db: configService.get<number>('REDIS_DB') ?? 0,
                            keyPrefix: `${options.appPrefix}:`,
                            connectionName: `${options.appPrefix}-connection`,
                            retryStrategy: (times: number) => Math.min(times * 50, 2000),
                            maxRetriesPerRequest: 3,
                            keepAlive: 30000,
                            connectTimeout: 10000,
                            commandTimeout: 5000,
                        },
                    }),
                    inject: [ConfigService],
                }),
            ],
            exports: [RedisModuleIoRedis],
        };
    }

    
}
