/**
 * Database Import Script
 *
 * Restores a SQL file into the configured database using psql.
 *
 * Usage:
 *   npm run db:import -- --file data/db-exports/<timestamp>/full.sql
 *   npm run db:import -- --file data/db-exports/<timestamp>/schema.sql --reset
 *
 * Options:
 *   --file <path>  Path to .sql file. If omitted, auto-select latest full.sql from data/db-exports/*
 *   --reset        Drop and recreate public schema before importing
 */

import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

interface CliOptions {
    filePath?: string;
    reset: boolean;
    help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
    const options: CliOptions = { reset: false, help: false };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === '--reset') {
            options.reset = true;
            continue;
        }

        if (arg === '--help' || arg === '-h') {
            options.help = true;
            continue;
        }

        if (arg === '--file') {
            const value = argv[i + 1];
            if (!value || value.startsWith('--')) {
                throw new Error('Missing value for --file');
            }
            options.filePath = value;
            i += 1;
            continue;
        }

        if (arg.startsWith('--file=')) {
            options.filePath = arg.slice('--file='.length);
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return options;
}

function envOrThrow(key: string): string {
    const value = process.env[key];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
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

function resolveLatestFullDump(): string {
    const exportsDir = path.join(process.cwd(), 'data', 'db-exports');
    if (!fs.existsSync(exportsDir)) {
        throw new Error('No export directory found at data/db-exports');
    }

    const candidates = fs
        .readdirSync(exportsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    for (let i = candidates.length - 1; i >= 0; i -= 1) {
        const fullPath = path.join(exportsDir, candidates[i], 'full.sql');
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }

    throw new Error('No full.sql found in data/db-exports/<timestamp>/');
}

async function runPsql(args: string[], pgEnv: NodeJS.ProcessEnv): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const child = spawn('psql', args, {
            env: pgEnv,
            stdio: 'inherit',
        });

        child.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT') {
                reject(
                    new Error(
                        'psql was not found. Install PostgreSQL client tools first (e.g. apt install postgresql-client).',
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
                reject(new Error(`psql failed with exit code ${code}`));
            }
        });
    });
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
        console.log('Database Import Script');
        console.log('Usage:');
        console.log('  npm run db:import -- --file data/db-exports/<timestamp>/full.sql');
        console.log('  npm run db:import -- --file data/db-exports/<timestamp>/schema.sql --reset');
        console.log('  npm run db:import');
        console.log('\nOptions:');
        console.log('  --file <path>   Path to a .sql file (default: latest data/db-exports/*/full.sql)');
        console.log('  --reset         Drop/recreate public schema before import');
        console.log('  --help, -h      Show this help');
        return;
    }

    const pgEnv = buildPgEnv();

    const selectedFile = options.filePath ? path.resolve(process.cwd(), options.filePath) : resolveLatestFullDump();
    if (!fs.existsSync(selectedFile)) {
        throw new Error(`SQL file not found: ${selectedFile}`);
    }

    if (path.extname(selectedFile).toLowerCase() !== '.sql') {
        throw new Error(`Only .sql files are supported. Received: ${selectedFile}`);
    }

    console.log(`\nImporting into database "${pgEnv.PGDATABASE}" from: ${selectedFile}`);
    console.log(`Reset schema: ${options.reset ? 'yes' : 'no'}`);

    if (options.reset) {
        await runPsql(
            [
                '-v',
                'ON_ERROR_STOP=1',
                '-c',
                'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO CURRENT_USER;',
            ],
            pgEnv,
        );
        console.log('Schema reset completed.');
    }

    await runPsql(['-v', 'ON_ERROR_STOP=1', '-f', selectedFile], pgEnv);
    console.log('\nDatabase import completed successfully.');
}

main().catch((error) => {
    console.error('\nDatabase import failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
