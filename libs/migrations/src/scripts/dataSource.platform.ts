import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Platform application entities.
import { UserEntity } from '../../../../apps/platform/src/users/entities/user.entity';
import { UserRoleEntity } from '../../../../apps/platform/src/users/entities/userRole.entity';
import { ProductsEntity } from '../../../../apps/platform/src/products/entities/products.entity';
import { ProductNamesEntity } from '../../../../apps/platform/src/products/entities/productNames.entity';
import { ProductUnitsEntity } from '../../../../apps/platform/src/products/entities/productUnits.entity';
import { ProductsHistoryEntity } from '../../../../apps/platform/src/products/entities/history/productsHistory.entity';
import { ProductUnitsHistoryEntity } from '../../../../apps/platform/src/products/entities/history/productUnitsHistory.entity';
import { ProductStockHistoryEntity } from '../../../../apps/platform/src/products/entities/history/productStockHistory.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const useSSL = process.env.DB_SSL === 'true';
const sslOptions = useSSL
    ? { rejectUnauthorized: true, ca: fs.readFileSync(process.env.DB_SSL_CERT || '/certs/global-bundle.pem').toString() }
    : false;

// Data source for platformService.
export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST_PLATFORM,
    port: parseInt(process.env.DB_PORT_PLATFORM || '5432'),
    username: process.env.DB_USERNAME_PLATFORM,
    password: process.env.DB_PASSWORD_PLATFORM,
    database: process.env.DB_DATABASE_PLATFORM,
    entities: [
        UserEntity,
        UserRoleEntity,
        ProductsEntity,
        ProductNamesEntity,
        ProductUnitsEntity,
        ProductsHistoryEntity,
        ProductUnitsHistoryEntity,
        ProductStockHistoryEntity,
    ],
    migrations: [path.join(__dirname, '../platform/*.{ts,js}')],
    synchronize: false,
    logging: true,
    ssl: sslOptions,
});