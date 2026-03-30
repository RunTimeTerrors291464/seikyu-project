import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const useSSL = process.env.DB_SSL === 'true';
const sslOptions = useSSL
    ? {
          rejectUnauthorized: true,
          ca: fs.readFileSync(process.env.DB_SSL_CERT || '/certs/global-bundle.pem').toString(),
      }
    : false;

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [],
    migrations: [path.join(__dirname, '../src/*.{ts,js}')],
    synchronize: false,
    logging: true,
    ssl: sslOptions,
});
