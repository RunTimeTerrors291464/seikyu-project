import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Set the .env file location to the dotenv config.
// process.cwd() is the current working directory of the node process.
dotenv.config({ path: path.join(process.cwd(), '.env') });

// The required database to check.
const databaseApplications: string[] = [
    'platform',
    'api_gateway',
    'invoices',
];

async function checkDatabase(databaseApplication: string) {
    const pgClient = new Client({
        host: process.env[`DB_HOST_${databaseApplication.toUpperCase()}`],
        port: parseInt(process.env[`DB_PORT_${databaseApplication.toUpperCase()}`] || '5432'),
        user: process.env[`DB_USERNAME_${databaseApplication.toUpperCase()}`],
        password: process.env[`DB_PASSWORD_${databaseApplication.toUpperCase()}`],
        database: 'postgres',
    });

    try {
        await pgClient.connect();
        const dbName = process.env[`DB_DATABASE_${databaseApplication.toUpperCase()}`];

        if (!dbName) {
            throw new Error(`DB_DATABASE_${databaseApplication.toUpperCase()} is not set`);
        }

        const result = await pgClient.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (result.rowCount && result.rowCount > 0) {
            console.log(`✓ Database "${dbName}" already exists (${databaseApplication})`);
        } else {
            await pgClient.query(`CREATE DATABASE ${dbName}`);
            console.log(`✓ Database "${dbName}" created (${databaseApplication})`);
        }
    } catch (error) {
        console.error(`❌ Error for ${databaseApplication}:`, error);
    } finally {
        await pgClient.end();
    }
}


async function checkAndCreateAllDatabases() {
    console.log('🔍 Checking and creating databases...\n');

    for (const databaseApp of databaseApplications) {
        await checkDatabase(databaseApp);
    }

    console.log('\n✅ All databases have been checked and created');
}

checkAndCreateAllDatabases();