/**
 * Clear Database Script
 *
 * Truncates all application tables in dependency order (children first, then
 * parents) so that foreign-key constraints are not violated.
 *
 * The TypeORM migrations table is intentionally left untouched so that the
 * migration history remains valid.
 *
 * Usage:
 *   npm run db:clear
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------

function buildPgSsl(): undefined | { rejectUnauthorized: boolean; ca: string } {
    if (process.env.DB_SSL !== 'true') return undefined;
    const certPath = process.env.DB_SSL_CERT || '/certs/global-bundle.pem';
    return { rejectUnauthorized: true, ca: fs.readFileSync(certPath).toString() };
}

async function createClient(): Promise<Client> {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: buildPgSsl(),
    });
    await client.connect();
    return client;
}

// ---------------------------------------------------------------------------
// Tables to clear (ordered: children before parents to respect FK constraints)
// ---------------------------------------------------------------------------

const TABLES_IN_ORDER: string[] = [
    // Dashboard
    'product_ranking_daily',
    'product_ranking_monthly',
    'product_ranking_yearly',

    // Invoice line items (children)
    'stock_adjustment_invoice_products',
    'return_selling_invoice_products',
    'return_import_invoice_products',
    'selling_invoice_products',
    'import_invoice_products',

    // Invoice headers
    'stock_adjustment_invoice',
    'return_selling_invoice',
    'return_import_invoice',
    'selling_invoice',
    'import_invoice',

    // Auth
    'refresh_tokens',

    // Product history / derived tables
    'product_stock_history',
    'product_overview',
    'products_history',
    'product_names',

    // Core product & unit tables
    'products',
    'product_units_history',
    'product_units',

    // Users (last — referenced by many tables above)
    'users',
];

// ---------------------------------------------------------------------------
// Confirmation prompt
// ---------------------------------------------------------------------------

async function confirm(question: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const db = `${process.env.DB_DATABASE ?? '?'}` +
               ` @ ${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}`;

    console.log('\n⚠️  WARNING: This will permanently delete ALL data from the database!');
    console.log(`   Target: ${db}`);
    console.log(`   Tables: ${TABLES_IN_ORDER.length}\n`);

    const ok = await confirm('Type "y" to proceed, anything else to abort: ');
    if (!ok) {
        console.log('Aborted.');
        process.exit(0);
    }

    const client = await createClient();
    console.log('\nConnected. Truncating tables...\n');

    try {
        await client.query('BEGIN');

        for (const table of TABLES_IN_ORDER) {
            await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
            console.log(`  ✓ ${table}`);
        }

        await client.query('COMMIT');
        console.log('\nAll tables cleared successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\nError — transaction rolled back:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
