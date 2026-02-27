/**
 * Global Teardown — runs ONCE after ALL spec files have completed.
 * Deletes all test data from the database.
 *
 * Uses `pg` directly (bypassing NestJS/TypeORM) because globalTeardown
 * runs in a separate Jest runner context.
 */

const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

module.exports = async function globalTeardown() {
    dotenv.config({ path: path.join(process.cwd(), '.env') });

    const client = new Client({
        host: process.env.DB_HOST_PLATFORM,
        port: parseInt(process.env.DB_PORT_PLATFORM || '5432'),
        user: process.env.DB_USERNAME_PLATFORM,
        password: process.env.DB_PASSWORD_PLATFORM,
        database: process.env.DB_DATABASE_PLATFORM,
    });

    await client.connect();

    try {
        // Delete in order to respect foreign key constraints.
        // Products — child tables first.
        await client.query('DELETE FROM product_stock_history');
        await client.query('DELETE FROM products_history');
        await client.query('DELETE FROM product_units_history');
        await client.query('DELETE FROM product_names');
        await client.query('DELETE FROM products');
        await client.query('DELETE FROM product_units');
        // Users — child tables first.
        await client.query('DELETE FROM user_roles');
        await client.query('DELETE FROM users');
        console.log('\n✅ [GlobalTeardown] Integration test data cleaned up.\n');
    } finally {
        await client.end();
    }
};
