import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export interface PostgresModuleOptions {
    databaseApplication: string;
    entities: any[];
}

@Module({})
export class PostgresModule {
    static forRoot(options: PostgresModuleOptions): DynamicModule {
        return {
            module: PostgresModule,
            imports: [

                // Get the .env file to PostgresModule.
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env'
                }),

                // Configure the postgres database with typeorm.
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule], // Import the config module to this module. So that the useFactory can access the .env file.
                    useFactory: (configService: ConfigService) => {
                        const databasePrefix = options.databaseApplication.toUpperCase();

                        const host = configService.getOrThrow(`DB_HOST_${databasePrefix}`);
                        const port = configService.getOrThrow(`DB_PORT_${databasePrefix}`);
                        const username = configService.getOrThrow(`DB_USERNAME_${databasePrefix}`);
                        const password = configService.getOrThrow(`DB_PASSWORD_${databasePrefix}`);
                        const database = configService.getOrThrow(`DB_DATABASE_${databasePrefix}`);

                        return {
                            type: 'postgres',
                            host,
                            port,
                            username,
                            password,
                            database,
                            entities: options.entities,
                            synchronize: false, // By default, the database will not be synchronized.
                            logging: true,
                            autoLoadEntities: false 
                        };
                    },
                    inject: [ConfigService],
                }),

                TypeOrmModule.forFeature(options.entities),
            ],
            providers: [],
            exports: [TypeOrmModule],
        };
    }
}
