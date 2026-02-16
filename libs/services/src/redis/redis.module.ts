import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as RedisModuleIoRedis } from '@nestjs-modules/ioredis';

export interface RedisModuleOptions {
    keyPrefix: string; // Redis does not have database, so we need to use a key prefix to avoid conflicts.
}

@Module({})
export class RedisModule {
    static forRoot(options: RedisModuleOptions): DynamicModule {
        return {
            module: RedisModule,
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env'
                }),

                RedisModuleIoRedis.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => {
                        return {
                            type: 'single', 
                            options: {
                                host: configService.getOrThrow<string>('REDIS_HOST'),
                                port: configService.getOrThrow<number>('REDIS_PORT'),
                                password: configService.get<string>('REDIS_PASSWORD'),
                                db: configService.get<number>('REDIS_DB') || 0,
                                keyPrefix: `${options.keyPrefix}:`,
                            },
                            // Retry the connection to the Redis server if it fails.
                            retryStrategy: (times: number) => {
                                const delay = Math.min(times * 50, 2000);
                                return delay;
                            },
                            maxRetriesPerRequest: 3,
                            keepAlive: 30000,
                            connectTimeout: 10000,
                            commandTimeout: 5000,
                            connectionName: `${options.keyPrefix}-service`,
                        }
                    },
                    inject: [ConfigService],
                }),
            ],
            providers: [],
            exports: [RedisModuleIoRedis],
        }
    }
}