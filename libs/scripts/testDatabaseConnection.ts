import { Client } from 'pg';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// ─── SSL helper ──────────────────────────────────────────────────────────────
function buildSslOptions(): false | { rejectUnauthorized: boolean; ca: string } {
    if (process.env.DB_SSL !== 'true') return false;

    const certPath = process.env.DB_SSL_CERT || '/certs/global-bundle.pem';

    if (!fs.existsSync(certPath)) {
        throw new Error(`DB_SSL is enabled but cert file not found: ${certPath}`);
    }

    return { rejectUnauthorized: true, ca: fs.readFileSync(certPath).toString() };
}

// ─── Timeout helper ──────────────────────────────────────────────────────────
const CONNECT_TIMEOUT_MS = 5_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(
                () => reject(new Error(`Connection timed out after ${ms / 1000}s — ${label} is unreachable`)),
                ms,
            ),
        ),
    ]);
}

// ─── Colours ────────────────────────────────────────────────────────────────
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
};

const ok = (msg: string) => console.log(`  ${c.green}✓${c.reset} ${msg}`);
const fail = (msg: string) => console.error(`  ${c.red}✗${c.reset} ${c.red}${msg}${c.reset}`);
const info = (msg: string) => console.log(`  ${c.cyan}›${c.reset} ${msg}`);
const section = (title: string) =>
    console.log(`\n${c.bold}${c.cyan}── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}${c.reset}`);

// ─── Redis ───────────────────────────────────────────────────────────────────
const REDIS_MOCK_KEY = '__seikyu_connection_test__';

async function testRedis(): Promise<boolean> {
    section('Redis');

    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');

    const redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        lazyConnect: true,
        connectTimeout: CONNECT_TIMEOUT_MS,
        // Disable auto-retry so the timeout fires cleanly instead of looping.
        retryStrategy: () => null,
        maxRetriesPerRequest: 0,
    });

    try {
        info(`Connecting to ${redisHost}:${redisPort} (db ${process.env.REDIS_DB ?? 0})`);
        await withTimeout(redis.connect(), CONNECT_TIMEOUT_MS, `Redis ${redisHost}:${redisPort}`);
        ok('Connected');

        // mock write
        await redis.set(REDIS_MOCK_KEY, 'seikyu_ok', 'EX', 30);
        ok('Mock key written');

        // verify
        const val = await redis.get(REDIS_MOCK_KEY);
        if (val !== 'seikyu_ok') throw new Error(`Unexpected value: ${val}`);
        ok('Mock key verified');

        // cleanup
        await redis.del(REDIS_MOCK_KEY);
        ok('Mock key removed');

        return true;
    } catch (err: unknown) {
        fail(`Redis error: ${(err as Error).message}`);
        return false;
    } finally {
        redis.disconnect();
    }
}

// ─── Postgres ────────────────────────────────────────────────────────────────
interface DbConfig {
    label: string;
    envKey: string;
}

const DB_CONFIGS: DbConfig[] = [
    { label: 'api-gateway', envKey: 'API_GATEWAY' },
    { label: 'platform', envKey: 'PLATFORM' },
    { label: 'invoices', envKey: 'INVOICES' },
];

const MOCK_TABLE = '__seikyu_connection_test__';

async function testPostgres(cfg: DbConfig): Promise<boolean> {
    const host = process.env[`DB_HOST_${cfg.envKey}`];
    const port = parseInt(process.env[`DB_PORT_${cfg.envKey}`] || '5432');
    const user = process.env[`DB_USERNAME_${cfg.envKey}`];
    const password = process.env[`DB_PASSWORD_${cfg.envKey}`];
    const database = process.env[`DB_DATABASE_${cfg.envKey}`];

    let ssl: false | { rejectUnauthorized: boolean; ca: string };
    try {
        ssl = buildSslOptions();
    } catch (err: unknown) {
        fail(`[${cfg.label}] SSL config error: ${(err as Error).message}`);
        return false;
    }

    const client = new Client({
        host,
        port,
        user,
        password,
        database,
        ssl: ssl || undefined,
        connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    });

    try {
        const sslLabel = ssl ? `${c.yellow}SSL on${c.reset}` : `${c.dim}SSL off${c.reset}`;
        info(`Connecting to ${host}:${port}/${database} [${sslLabel}]`);
        await withTimeout(client.connect(), CONNECT_TIMEOUT_MS, `PostgreSQL ${host}:${port}/${database}`);
        ok('Connected');

        // mock: create temp table & insert
        await client.query(`
            CREATE TEMP TABLE ${MOCK_TABLE} (
                id   SERIAL PRIMARY KEY,
                ping TEXT NOT NULL
            )
        `);
        await client.query(`INSERT INTO ${MOCK_TABLE} (ping) VALUES ($1)`, ['seikyu_ok']);
        ok('Mock data written');

        // verify
        const res = await client.query(`SELECT ping FROM ${MOCK_TABLE} WHERE ping = $1`, ['seikyu_ok']);
        if (!res.rowCount || res.rowCount < 1) throw new Error('Row not found after insert');
        ok('Mock data verified');

        // cleanup — TEMP tables are dropped automatically on disconnect,
        // but we drop explicitly to be explicit.
        await client.query(`DROP TABLE IF EXISTS ${MOCK_TABLE}`);
        ok('Mock table dropped');

        return true;
    } catch (err: unknown) {
        fail(`[${cfg.label}] ${(err as Error).message}`);
        return false;
    } finally {
        await client.end();
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
    console.log(
        `\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════════╗${c.reset}`,
    );
    console.log(
        `${c.bold}${c.cyan}║       Seikyu — Connection Pre-flight Check           ║${c.reset}`,
    );
    console.log(
        `${c.bold}${c.cyan}╚══════════════════════════════════════════════════════╝${c.reset}`,
    );

    const results: boolean[] = [];

    // Redis
    results.push(await testRedis());

    // All Postgres databases
    for (const cfg of DB_CONFIGS) {
        section(`PostgreSQL › ${cfg.label}`);
        results.push(await testPostgres(cfg));
    }

    // Summary
    const passed = results.filter(Boolean).length;
    const total = results.length;

    console.log(`\n${c.bold}─────────────────────────────────────────────────────────${c.reset}`);
    if (passed === total) {
        console.log(`${c.green}${c.bold}  ✔  All ${total} checks passed — safe to start services.${c.reset}\n`);
    } else {
        console.error(
            `${c.red}${c.bold}  ✘  ${total - passed}/${total} checks failed — fix the issues above before starting.${c.reset}\n`,
        );
        process.exit(1);
    }
}

main();
