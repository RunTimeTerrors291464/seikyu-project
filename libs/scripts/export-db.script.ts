/**
 * Database Export Script
 *
 * Creates timestamped SQL dump files using pg_dump:
 *   - full.sql   : full schema + data
 *   - schema.sql : schema only
 *   - data.sql   : data only (INSERT statements)
 *
 * Usage:
 *   npm run db:export
 */

import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

function envOrThrow(key: string): string {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function timestamp(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}-${hh}${mm}${ss}`;
}

function buildPgEnv(): NodeJS.ProcessEnv {
    const baseEnv: NodeJS.ProcessEnv = {
        ...process.env,
        PGHOST: envOrThrow('DB_HOST'),
        PGPORT: process.env.DB_PORT || '5432',
        PGUSER: envOrThrow('DB_USERNAME'),
        PGPASSWORD: envOrThrow('DB_PASSWORD'),
        PGDATABASE: envOrThrow('DB_DATABASE'),
    };

    if (process.env.DB_SSL === 'true') {
        const certPath = process.env.DB_SSL_CERT;
        baseEnv.PGSSLMODE = certPath ? 'verify-ca' : 'require';
        if (certPath) {
            baseEnv.PGSSLROOTCERT = certPath;
        }
    }

    return baseEnv;
}

async function runPgDump(args: string[], pgEnv: NodeJS.ProcessEnv): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const child = spawn('pg_dump', args, {
            env: pgEnv,
            stdio: 'inherit',
        });

        child.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT') {
                reject(
                    new Error(
                        'pg_dump was not found. Install PostgreSQL client tools first (e.g. apt install postgresql-client).',
                    ),
                );
                return;
            }
            reject(err);
        });

        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`pg_dump failed with exit code ${code}`));
            }
        });
    });
}

async function main(): Promise<void> {
    const pgEnv = buildPgEnv();

    const outputDir = path.join(process.cwd(), 'data', 'db-exports', timestamp());
    fs.mkdirSync(outputDir, { recursive: true });

    const fullPath = path.join(outputDir, 'full.sql');
    const schemaPath = path.join(outputDir, 'schema.sql');
    const dataPath = path.join(outputDir, 'data.sql');

    console.log(`\nExporting database "${pgEnv.PGDATABASE}" to: ${outputDir}`);

    await runPgDump(
        ['--no-owner', '--no-privileges', '--encoding=UTF8', '--file', fullPath],
        pgEnv,
    );
    console.log(`Created ${fullPath}`);

    await runPgDump(
        ['--schema-only', '--no-owner', '--no-privileges', '--encoding=UTF8', '--file', schemaPath],
        pgEnv,
    );
    console.log(`Created ${schemaPath}`);

    await runPgDump(
        [
            '--data-only',
            '--inserts',
            '--no-owner',
            '--no-privileges',
            '--encoding=UTF8',
            '--file',
            dataPath,
        ],
        pgEnv,
    );
    console.log(`Created ${dataPath}`);

    console.log('\nDatabase export completed successfully.');
}

main().catch((error) => {
    console.error('\nDatabase export failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
