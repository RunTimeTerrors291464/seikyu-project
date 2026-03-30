import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

import AppDataSource from './dataSource';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function runMigrations() {
    const dbName = process.env.DB_DATABASE;
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '5432');
    const user = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;

    if (!dbName) {
        console.error('❌ DB_DATABASE is not set in .env');
        process.exit(1);
    }

    // Step 1: Check connection to the PostgreSQL server via the default "postgres" database.
    console.log(`\n🔍 Checking connection to PostgreSQL server at ${host}:${port}...`);
    const pgClient = new Client({
        host,
        port,
        user,
        password,
        database: 'postgres',
    });

    try {
        await pgClient.connect();
        console.log('✓ Connected to PostgreSQL server');

        // Step 2: Check if the target database exists.
        const result = await pgClient.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName],
        );

        if (result.rowCount && result.rowCount > 0) {
            console.log(`✓ Database "${dbName}" already exists`);
        } else {
            await pgClient.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✓ Database "${dbName}" created successfully`);
        }
    } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL server:', error.message);
        process.exit(1);
    } finally {
        await pgClient.end();
    }

    // Step 3: Run TypeORM migrations against the target database.
    console.log(`\n🚀 Running migrations on database "${dbName}"...`);
    try {
        await AppDataSource.initialize();

        const migrations = await AppDataSource.runMigrations();

        if (migrations.length === 0) {
            console.log('✓ No new migrations to run. Database is already up to date.');
        } else {
            console.log(`✓ Successfully ran ${migrations.length} migration(s):`);
            migrations.forEach((m) => console.log(`  - ${m.name}`));
        }

        await AppDataSource.destroy();
        console.log('\n✅ Migration process completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigrations();
