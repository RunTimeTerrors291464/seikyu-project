import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import Redis from 'ioredis';
import { MigrationExecutor } from 'typeorm';
import * as dotenv from 'dotenv';

import AppDataSource from '../migrations/scripts/dataSource';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function checkRedis(): Promise<void> {
    const host = process.env.REDIS_HOST;
    if (!host) {
        throw new Error('REDIS_HOST is not configured in .env');
    }
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const db = parseInt(String(process.env.REDIS_DB ?? '0'), 10);
    const redis = new Redis({
        host,
        port,
        password: process.env.REDIS_PASSWORD || undefined,
        db,
        maxRetriesPerRequest: 1,
        connectTimeout: 10000,
        retryStrategy: () => null,
    });
    try {
        const pong = await redis.ping();
        if (pong !== 'PONG') {
            throw new Error(`Unexpected PING response: ${pong}`);
        }
    } finally {
        redis.disconnect();
    }
}

function buildPgSsl(): undefined | { rejectUnauthorized: boolean; ca: string } {
    if (process.env.DB_SSL !== 'true') {
        return undefined;
    }
    const certPath = process.env.DB_SSL_CERT || '/certs/global-bundle.pem';
    return {
        rejectUnauthorized: true,
        ca: fs.readFileSync(certPath).toString(),
    };
}

async function checkPostgres(): Promise<void> {
    const database = process.env.DB_DATABASE;
    const host = process.env.DB_HOST;
    const user = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;
    if (!database || !host || !user) {
        throw new Error('DB_DATABASE, DB_HOST, and DB_USERNAME must be configured in .env');
    }
    const port = parseInt(process.env.DB_PORT || '5432', 10);
    const ssl = buildPgSsl();
    const client = new Client({
        host,
        port,
        user,
        password,
        database,
        ...(ssl !== undefined ? { ssl } : {}),
    });
    await client.connect();
    try {
        await client.query('SELECT 1');
    } finally {
        await client.end();
    }
}

async function checkMigrationsApplied(): Promise<void> {
    await AppDataSource.initialize();
    try {
        const executor = new MigrationExecutor(AppDataSource);
        const pending = await executor.getPendingMigrations();
        if (pending.length > 0) {
            const list = pending.map((m) => m.name).join('\n  - ');
            throw new Error(
                `${pending.length} pending migration(s) found. Run: npm run migration:run\n  - ${list}`,
            );
        }
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

function startNestWatch(): void {
    const nestCli = path.join(process.cwd(), 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
    const child = spawn(process.execPath, [nestCli, 'start', '--watch'], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: process.env,
    });
    child.on('exit', (code, signal) => {
        process.exit(code ?? (signal ? 1 : 0));
    });
    child.on('error', (err) => {
        console.error(err);
        process.exit(1);
    });
}

async function main(): Promise<void> {
    console.log('\n[start:dev] Checking Redis connection...');
    try {
        await checkRedis();
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Redis: ${msg}`);
    }
    console.log('[start:dev] Redis: OK');

    console.log('\n[start:dev] Checking PostgreSQL connection...');
    try {
        await checkPostgres();
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`PostgreSQL: ${msg}`);
    }
    console.log('[start:dev] PostgreSQL: OK');

    console.log('\n[start:dev] Checking pending migrations...');
    try {
        await checkMigrationsApplied();
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`${msg}`);
    }
    console.log('[start:dev] Migrations: OK (no pending migrations)');

    console.log('\n[start:dev] Starting Nest in watch mode...\n');
    startNestWatch();
}

main().catch((err) => {
    console.error('\n[start:dev] Failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
