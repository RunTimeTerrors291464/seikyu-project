import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Platform application entities.
import { UserEntity } from '../../../../apps/platform/src/users/entities/user.entity';
import { UserRoleEntity } from '../../../../apps/platform/src/users/entities/userRole.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

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
    ],
    migrations: [path.join(__dirname, '../platform/*.{ts,js}')],
    synchronize: false,
    logging: true,
});