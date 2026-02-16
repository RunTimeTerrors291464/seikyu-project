import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// API Gateway application entities.
import { RefreshTokenEntity } from '../../../../apps/api-gateway/src/auth/entities/refreshToken.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// Data source for apiGateway.
export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST_API_GATEWAY,
    port: parseInt(process.env.DB_PORT_API_GATEWAY || '5432'),
    username: process.env.DB_USERNAME_API_GATEWAY,
    password: process.env.DB_PASSWORD_API_GATEWAY,
    database: process.env.DB_DATABASE_API_GATEWAY,
    entities: [
        RefreshTokenEntity
    ],
    migrations: [path.join(__dirname, '../api-gateway/*.{ts,js}')],
    synchronize: false,
    logging: true,
});