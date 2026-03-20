import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const databaseApplications: string[] = [
    'platform',
    'api_gateway',
    'invoices',
];

async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(message, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

async function clearDatabase(databaseApplication: string): Promise<void> {
    const envKey = databaseApplication.toUpperCase();
    const pgClient = new Client({
        host: process.env[`DB_HOST_${envKey}`],
        port: parseInt(process.env[`DB_PORT_${envKey}`] || '5432'),
        user: process.env[`DB_USERNAME_${envKey}`],
        password: process.env[`DB_PASSWORD_${envKey}`],
        database: process.env[`DB_DATABASE_${envKey}`],
    });

    try {
        await pgClient.connect();
        const dbName = process.env[`DB_DATABASE_${envKey}`];

        const result = await pgClient.query<{ tablename: string }>(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename != 'migrations'
            ORDER BY tablename
        `);

        const tables = result.rows.map((row) => row.tablename);

        if (tables.length === 0) {
            console.log(`  ⚠ No tables found in "${dbName}" (${databaseApplication})`);
            return;
        }

        const tableList = tables.map((t) => `"${t}"`).join(', ');
        await pgClient.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);

        console.log(`  ✓ Cleared ${tables.length} table(s) in "${dbName}" (${databaseApplication}):`);
        tables.forEach((t) => console.log(`    - ${t}`));
    } catch (error) {
        console.error(`  ❌ Error clearing "${databaseApplication}":`, error);
    } finally {
        await pgClient.end();
    }
}

async function clearAllDatabases(): Promise<void> {
    console.log('⚠️  WARNING: This will DELETE ALL DATA from all databases!\n');
    console.log('Databases affected:', databaseApplications.join(', '));
    console.log('');

    const confirmed = await confirm('Are you sure you want to continue? (y/N): ');

    if (!confirmed) {
        console.log('\n✗ Aborted. No data was deleted.');
        process.exit(0);
    }

    console.log('\n🗑️  Clearing all databases...\n');

    for (const databaseApp of databaseApplications) {
        await clearDatabase(databaseApp);
    }

    console.log('\n✅ All databases have been cleared.');
}

clearAllDatabases();
