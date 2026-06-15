/**
 * seed-via-api.script.ts
 *
 * End-to-end seed script that:
 *   1. Resets all application data via a direct DB connection.
 *   2. Re-seeds everything through the live HTTP API (no direct DB writes for
 *      business data — only the reset uses raw SQL).
 *
 * Users created:
 *   - superuser  (first-seed-admin)  — ADMIN-only via /first-admin-account
 *   - admin      (admin)             — ADMIN role
 *   - manager    (manager)           — MANAGER role
 *   - cashier    (cashier)           — CASHIER role
 *
 * Other data:
 *   - 11 product units
 *   - 30 products (Vietnamese retail store)
 *   - 30 import invoices (draft → confirmed by manager)
 *   - 30 selling invoices (confirmed by cashier)
 *
 * Usage:
 *   npm run seed:api
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = (process.env.SEED_API_BASE_URL ?? `http://localhost:${process.env.APP_PORT ?? 3000}`).replace(/\/$/, '');

function env(key: string, fallback = ''): string {
    return process.env[key] ?? fallback;
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// DB helpers (used only for reset)
// ---------------------------------------------------------------------------

function buildPgSsl(): undefined | { rejectUnauthorized: boolean; ca: string } {
    if (process.env.DB_SSL !== 'true') return undefined;
    const certPath = process.env.DB_SSL_CERT || '/certs/global-bundle.pem';
    return { rejectUnauthorized: true, ca: fs.readFileSync(certPath).toString() };
}

async function createDbClient(): Promise<Client> {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: buildPgSsl(),
    });
    await client.connect();
    return client;
}

async function resetDatabase(): Promise<void> {
    console.log('🗑️  Resetting database...');
    const client = await createDbClient();
    try {
        // Truncate all application tables in dependency order.
        // Using CASCADE removes the need to enumerate every child table explicitly.
        await client.query(`
            TRUNCATE
                product_ranking_daily,
                product_ranking_monthly,
                product_ranking_yearly,
                product_stock_history,
                stock_adjustment_invoice_products,
                stock_adjustment_invoice,
                return_import_invoice_products,
                return_import_invoice,
                import_invoice_products,
                import_invoice,
                return_selling_invoice_products,
                return_selling_invoice,
                selling_invoice_products,
                selling_invoice,
                products_history,
                product_names,
                product_units_history,
                products,
                product_units,
                refresh_tokens,
                users
            CASCADE
        `);
        console.log('  ✓ All tables truncated\n');
    } finally {
        await client.end();
    }
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiPost<T>(endpoint: string, body: unknown, token?: string): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST ${endpoint} → ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

async function login(username: string, password: string): Promise<string> {
    const data = await apiPost<{ accessToken: string }>('/api/v2/auth/login', { username, password });
    return data.accessToken;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const PRODUCT_UNITS = [
    { unitName: 'Cái',   unitDescription: 'Đơn vị tính: cái / chiếc' },
    { unitName: 'Hộp',   unitDescription: 'Đơn vị tính: hộp' },
    { unitName: 'Chai',  unitDescription: 'Đơn vị tính: chai' },
    { unitName: 'Gói',   unitDescription: 'Đơn vị tính: gói / túi nhỏ' },
    { unitName: 'Lon',   unitDescription: 'Đơn vị tính: lon' },
    { unitName: 'Túi',   unitDescription: 'Đơn vị tính: túi' },
    { unitName: 'Cuộn',  unitDescription: 'Đơn vị tính: cuộn' },
    { unitName: 'Kg',    unitDescription: 'Đơn vị tính: kilogram' },
    { unitName: 'Lít',   unitDescription: 'Đơn vị tính: lít' },
    { unitName: 'Bộ',    unitDescription: 'Đơn vị tính: bộ / set' },
    { unitName: 'Vỉ',    unitDescription: 'Đơn vị tính: vỉ / blister pack' },
];

interface ProductDef {
    sku: string;
    productNames: string[];
    unitName: string;
    productDescription: string;
    importPrice: number;
    sellingPrice: number;
    reorderThreshold: number;
}

const PRODUCTS: ProductDef[] = [
    {
        sku: '8934588012345',
        productNames: ['Nước suối Aquafina 500ml', 'Aquafina Drinking Water 500ml'],
        unitName: 'Chai',
        productDescription: 'Nước uống tinh khiết Aquafina, chai 500ml',
        importPrice: 5000,  sellingPrice: 8000,  reorderThreshold: 50,
    },
    {
        sku: '5449000000996',
        productNames: ['Coca-Cola 330ml', 'Coke 330ml Can'],
        unitName: 'Lon',
        productDescription: 'Nước ngọt có gas Coca-Cola, lon 330ml',
        importPrice: 9000,  sellingPrice: 14000, reorderThreshold: 40,
    },
    {
        sku: '5449000025098',
        productNames: ['Pepsi 330ml', 'Pepsi Cola 330ml'],
        unitName: 'Lon',
        productDescription: 'Nước ngọt có gas Pepsi, lon 330ml',
        importPrice: 8500,  sellingPrice: 13000, reorderThreshold: 40,
    },
    {
        sku: '8934673640015',
        productNames: ['Sữa tươi Vinamilk 1L', 'Vinamilk Fresh Milk 1L'],
        unitName: 'Hộp',
        productDescription: 'Sữa tươi tiệt trùng Vinamilk, hộp giấy 1 lít',
        importPrice: 28000, sellingPrice: 36000, reorderThreshold: 30,
    },
    {
        sku: '8934563130016',
        productNames: ['Mì gói Hảo Hảo tôm chua cay', 'Hao Hao Noodles Shrimp Spicy'],
        unitName: 'Gói',
        productDescription: 'Mì ăn liền Hảo Hảo vị tôm chua cay, gói 74g',
        importPrice: 4500,  sellingPrice: 6500,  reorderThreshold: 100,
    },
    {
        sku: '8934678000017',
        productNames: ['Trứng gà ta (vỉ 10 quả)', 'Fresh Farm Eggs x10'],
        unitName: 'Vỉ',
        productDescription: 'Trứng gà tươi, vỉ 10 quả',
        importPrice: 30000, sellingPrice: 38000, reorderThreshold: 20,
    },
    {
        sku: '8934822000018',
        productNames: ['Dầu ăn Neptune 1L', 'Neptune Cooking Oil 1L'],
        unitName: 'Chai',
        productDescription: 'Dầu ăn Neptune tinh luyện, chai nhựa 1 lít',
        importPrice: 42000, sellingPrice: 55000, reorderThreshold: 20,
    },
    {
        sku: '8934675000019',
        productNames: ['Nước mắm Chin-su 500ml', 'Chinsu Fish Sauce 500ml'],
        unitName: 'Chai',
        productDescription: 'Nước mắm Chin-su cao cấp, chai 500ml, độ đạm 40N',
        importPrice: 32000, sellingPrice: 42000, reorderThreshold: 25,
    },
    {
        sku: '8934568000020',
        productNames: ['Gạo ST25 túi 5kg', 'ST25 Premium Rice 5kg'],
        unitName: 'Túi',
        productDescription: 'Gạo ST25 thơm ngon, túi 5kg',
        importPrice: 95000, sellingPrice: 120000, reorderThreshold: 15,
    },
    {
        sku: '8935001000021',
        productNames: ['Đường cát trắng Biên Hòa 1kg', 'Bien Hoa White Sugar 1kg'],
        unitName: 'Túi',
        productDescription: 'Đường cát trắng tinh luyện Biên Hòa, túi 1kg',
        importPrice: 22000, sellingPrice: 28000, reorderThreshold: 30,
    },
    {
        sku: '8934522000022',
        productNames: ['Bột ngọt Ajinomoto 200g', 'Ajinomoto MSG 200g'],
        unitName: 'Gói',
        productDescription: 'Bột ngọt Ajinomoto chính hãng, gói 200g',
        importPrice: 18000, sellingPrice: 25000, reorderThreshold: 30,
    },
    {
        sku: '8934001000023',
        productNames: ['Xà phòng Dove dưỡng ẩm 100g', 'Dove Moisturizing Bar 100g'],
        unitName: 'Cái',
        productDescription: 'Xà phòng bánh Dove dưỡng ẩm, 100g',
        importPrice: 18000, sellingPrice: 26000, reorderThreshold: 30,
    },
    {
        sku: '8934867000024',
        productNames: ['Kem đánh răng P/S 120g', 'P/S Toothpaste 120g'],
        unitName: 'Hộp',
        productDescription: 'Kem đánh răng P/S bảo vệ răng chắc khỏe, 120g',
        importPrice: 20000, sellingPrice: 28000, reorderThreshold: 25,
    },
    {
        sku: '8934501000025',
        productNames: ['Dầu gội Sunsilk mềm mượt 330ml', 'Sunsilk Shampoo Smooth 330ml'],
        unitName: 'Chai',
        productDescription: 'Dầu gội Sunsilk dưỡng mượt, chai 330ml',
        importPrice: 55000, sellingPrice: 72000, reorderThreshold: 20,
    },
    {
        sku: '8934678900026',
        productNames: ['Nước rửa chén Sunlight 750ml', 'Sunlight Dishwash Liquid 750ml'],
        unitName: 'Chai',
        productDescription: 'Nước rửa chén Sunlight hương chanh, chai 750ml',
        importPrice: 26000, sellingPrice: 36000, reorderThreshold: 25,
    },
    {
        sku: '8934800000027',
        productNames: ['Giấy vệ sinh Bless You 10 cuộn', 'Bless You Toilet Paper x10'],
        unitName: 'Bộ',
        productDescription: 'Giấy vệ sinh Bless You 2 lớp, lốc 10 cuộn',
        importPrice: 55000, sellingPrice: 75000, reorderThreshold: 15,
    },
    {
        sku: '8934551000028',
        productNames: ['Sữa đặc Ông Thọ lon xanh 380g', 'Ong Tho Condensed Milk 380g'],
        unitName: 'Lon',
        productDescription: 'Sữa đặc có đường Ông Thọ, lon 380g',
        importPrice: 22000, sellingPrice: 30000, reorderThreshold: 30,
    },
    {
        sku: '8934561000029',
        productNames: ['Cà phê G7 3in1 (hộp 50 gói)', 'G7 3in1 Instant Coffee x50'],
        unitName: 'Hộp',
        productDescription: 'Cà phê hòa tan G7 3in1, hộp 50 gói x 16g',
        importPrice: 95000, sellingPrice: 125000, reorderThreshold: 20,
    },
    {
        sku: '8934010000030',
        productNames: ['Trà xanh 0 độ 450ml', '0 Degree Green Tea 450ml'],
        unitName: 'Chai',
        productDescription: 'Trà xanh không đường 0 Độ, chai 450ml',
        importPrice: 8500,  sellingPrice: 13000, reorderThreshold: 40,
    },
    {
        sku: '5099873004040',
        productNames: ['Red Bull 250ml', 'Red Bull Energy Drink 250ml'],
        unitName: 'Lon',
        productDescription: 'Nước tăng lực Red Bull, lon 250ml',
        importPrice: 10500, sellingPrice: 15000, reorderThreshold: 40,
    },
    {
        sku: '8934690000041',
        productNames: ['Snack Poca vị tôm 30g', 'Poca Shrimp Chips 30g'],
        unitName: 'Gói',
        productDescription: 'Bánh snack khoai tây Poca vị tôm, gói 30g',
        importPrice: 9000,  sellingPrice: 13000, reorderThreshold: 50,
    },
    {
        sku: '7622200166399',
        productNames: ['Kẹo cao su Doublemint 5 thanh', 'Doublemint Chewing Gum 5pcs'],
        unitName: 'Gói',
        productDescription: 'Kẹo cao su Doublemint hương bạc hà, 5 thanh',
        importPrice: 5000,  sellingPrice: 7000,  reorderThreshold: 60,
    },
    {
        sku: '8934673500043',
        productNames: ['Bánh quy Kinh Đô hộp 400g', 'Kinh Do Cookies 400g'],
        unitName: 'Hộp',
        productDescription: 'Bánh quy bơ Kinh Đô, hộp thiếc 400g',
        importPrice: 65000, sellingPrice: 85000, reorderThreshold: 15,
    },
    {
        sku: '0041333422220',
        productNames: ['Pin AA Duracell (vỉ 4 viên)', 'Duracell AA Batteries x4'],
        unitName: 'Vỉ',
        productDescription: 'Pin kiềm AA Duracell, vỉ 4 viên',
        importPrice: 38000, sellingPrice: 55000, reorderThreshold: 20,
    },
    {
        sku: '8934867110045',
        productNames: ['Nước giặt Omo Matic 3kg', 'Omo Matic Laundry 3kg'],
        unitName: 'Túi',
        productDescription: 'Bột giặt máy Omo Matic cửa trước, túi 3kg',
        importPrice: 115000, sellingPrice: 150000, reorderThreshold: 10,
    },
    {
        sku: '8934588020046',
        productNames: ['Nước ngọt Sting dâu 330ml', 'Sting Strawberry Energy 330ml'],
        unitName: 'Lon',
        productDescription: 'Nước tăng lực Sting hương dâu, lon 330ml',
        importPrice: 8000,  sellingPrice: 12000, reorderThreshold: 40,
    },
    {
        sku: '8934009000047',
        productNames: ['Bánh mì sandwich Kinh Đô', 'Kinh Do Sandwich Bread'],
        unitName: 'Gói',
        productDescription: 'Bánh mì sandwich Kinh Đô, gói 300g',
        importPrice: 20000, sellingPrice: 28000, reorderThreshold: 20,
    },
    {
        sku: '8934590000048',
        productNames: ['Khăn giấy Tempo 3 lớp (hộp 200 tờ)', 'Tempo Facial Tissue 3-ply 200s'],
        unitName: 'Hộp',
        productDescription: 'Khăn giấy Tempo mềm mại 3 lớp, hộp 200 tờ',
        importPrice: 28000, sellingPrice: 40000, reorderThreshold: 20,
    },
    {
        sku: '8934623000049',
        productNames: ['Nước tương Maggi 700ml', 'Maggi Soy Sauce 700ml'],
        unitName: 'Chai',
        productDescription: 'Nước tương Maggi đậu nành, chai 700ml',
        importPrice: 28000, sellingPrice: 38000, reorderThreshold: 25,
    },
    {
        sku: '8934004000050',
        productNames: ['Bia Tiger lon 330ml', 'Tiger Beer Can 330ml'],
        unitName: 'Lon',
        productDescription: 'Bia Tiger lager cao cấp, lon 330ml',
        importPrice: 14000, sellingPrice: 20000, reorderThreshold: 48,
    },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
    console.log('\n🌱 Starting API-based database seed...\n');
    console.log(`  API base URL: ${BASE_URL}\n`);

    // -----------------------------------------------------------------------
    // Step 0: Reset DB
    // -----------------------------------------------------------------------
    await resetDatabase();

    // -----------------------------------------------------------------------
    // Step 1: Create superuser (first-admin-account — PUBLIC endpoint)
    // -----------------------------------------------------------------------
    console.log('👤 Creating superuser (first-admin-account)...');
    await apiPost('/api/v2/admin/first-admin-account', {
        firstName: 'Super',
        lastName: 'User',
        username: env('SEED_FIRST_ADMIN_USERNAME', 'first-seed-admin'),
        password: env('SEED_FIRST_ADMIN_PASSWORD', 'admin123'),
    });
    console.log(`  ✓ Created: ${env('SEED_FIRST_ADMIN_USERNAME', 'first-seed-admin')}\n`);

    // -----------------------------------------------------------------------
    // Step 2: Login as superuser → admin token
    // -----------------------------------------------------------------------
    console.log('🔑 Logging in as superuser...');
    const adminToken = await login(
        env('SEED_FIRST_ADMIN_USERNAME', 'first-seed-admin'),
        env('SEED_FIRST_ADMIN_PASSWORD', 'admin123'),
    );
    console.log('  ✓ Login successful\n');

    // -----------------------------------------------------------------------
    // Step 3: Create admin, manager, cashier
    // -----------------------------------------------------------------------
    console.log('👥 Creating remaining users...');

    await apiPost('/api/v2/admin/users', {
        firstName: 'Admin',
        username: env('SEED_ADMIN_USERNAME', 'admin'),
        password: env('SEED_ADMIN_PASSWORD', 'admin123'),
        roles: [1], // ADMIN
    }, adminToken);
    console.log(`  ✓ Created admin: ${env('SEED_ADMIN_USERNAME', 'admin')}`);

    await apiPost('/api/v2/admin/users', {
        firstName: 'Manager',
        username: env('SEED_MANAGER_USERNAME', 'manager'),
        password: env('SEED_MANAGER_PASSWORD', 'manager123'),
        roles: [2], // MANAGER
    }, adminToken);
    console.log(`  ✓ Created manager: ${env('SEED_MANAGER_USERNAME', 'manager')}`);

    await apiPost('/api/v2/admin/users', {
        firstName: 'Cashier',
        username: env('SEED_CASHIER_USERNAME', 'cashier'),
        password: env('SEED_CASHIER_PASSWORD', 'cashier123'),
        roles: [3], // CASHIER
    }, adminToken);
    console.log(`  ✓ Created cashier: ${env('SEED_CASHIER_USERNAME', 'cashier')}\n`);

    // -----------------------------------------------------------------------
    // Step 4: Login as manager
    // -----------------------------------------------------------------------
    console.log('🔑 Logging in as manager...');
    const managerToken = await login(
        env('SEED_MANAGER_USERNAME', 'manager'),
        env('SEED_MANAGER_PASSWORD', 'manager123'),
    );
    console.log('  ✓ Login successful\n');

    // -----------------------------------------------------------------------
    // Step 5: Create product units
    // -----------------------------------------------------------------------
    console.log('📦 Creating product units...');
    const unitIdByName: Record<string, string> = {};

    for (const pu of PRODUCT_UNITS) {
        const result = await apiPost<{ id: string }>('/api/v2/product-units', pu, managerToken);
        unitIdByName[pu.unitName] = result.id;
        console.log(`  ✓ ${pu.unitName} (${result.id})`);
    }
    console.log('');

    // -----------------------------------------------------------------------
    // Step 6: Create products
    // -----------------------------------------------------------------------
    console.log('🛒 Creating products...');
    const productMap: Record<string, { id: string; sku: string; name: string; unitName: string; sellingPrice: number; reorderThreshold: number }> = {};

    for (const p of PRODUCTS) {
        const unitId = unitIdByName[p.unitName] ?? Object.values(unitIdByName)[0];
        const result = await apiPost<{ id: string }>('/api/v2/products', {
            sku: p.sku,
            productNames: p.productNames,
            productUnitId: unitId,
            productDescription: p.productDescription,
            importPrice: p.importPrice,
            sellingPrice: p.sellingPrice,
            reorderThreshold: p.reorderThreshold,
        }, managerToken);

        productMap[p.sku] = {
            id: result.id,
            sku: p.sku,
            name: p.productNames[0],
            unitName: p.unitName,
            sellingPrice: p.sellingPrice,
            reorderThreshold: p.reorderThreshold,
        };
        console.log(`  ✓ ${p.productNames[0]} (${p.sku})`);
    }
    console.log('');

    // -----------------------------------------------------------------------
    // Step 7: Create & confirm 30 import invoices
    // -----------------------------------------------------------------------
    console.log('📥 Creating & confirming import invoices...');

    const importCount = parseInt(env('SEED_IMPORT_INVOICES', '30'), 10);
    const productList = Object.values(productMap);

    // Track expected stock locally so selling invoices stay within limits
    const stockMap: Record<string, number> = {};
    for (const p of productList) stockMap[p.sku] = 0;

    for (let i = 1; i <= importCount; i++) {
        const productCount = randInt(2, 5);
        const chosen = [...productList].sort(() => Math.random() - 0.5).slice(0, productCount);

        const products = chosen.map((p) => {
            const importDef = PRODUCTS.find(x => x.sku === p.sku)!;
            const qty = randInt(10, 100);
            stockMap[p.sku] = (stockMap[p.sku] ?? 0) + qty;
            return {
                productId: p.id,
                productSku: p.sku,
                productName: p.name,
                productUnit: p.unitName,
                quantity: qty,
                importPrice: importDef.importPrice,
            };
        });

        const draft = await apiPost<{ id: string }>('/api/v2/invoices/import', { products }, managerToken);
        await apiPost(`/api/v2/invoices/import/${draft.id}/confirm`, {}, managerToken);

        const totalQty = products.reduce((s, x) => s + x.quantity, 0);
        console.log(`  ✓ IMP-${String(i).padStart(5, '0')} (${products.length} products, qty ${totalQty})`);
    }
    console.log('');

    // -----------------------------------------------------------------------
    // Step 8: Login as cashier
    // -----------------------------------------------------------------------
    console.log('🔑 Logging in as cashier...');
    const cashierToken = await login(
        env('SEED_CASHIER_USERNAME', 'cashier'),
        env('SEED_CASHIER_PASSWORD', 'cashier123'),
    );
    console.log('  ✓ Login successful\n');

    // -----------------------------------------------------------------------
    // Step 9: Create 30 selling invoices
    // -----------------------------------------------------------------------
    console.log('🛍️  Creating selling invoices...');

    const sellingCount = parseInt(env('SEED_SELLING_INVOICES', '30'), 10);

    for (let i = 1; i <= sellingCount; i++) {
        // Only sell products that have remaining stock
        const inStock = productList.filter(p => (stockMap[p.sku] ?? 0) > 0);
        if (inStock.length === 0) {
            console.log(`  ↳ No stock remaining, stopping at invoice ${i}`);
            break;
        }

        const productCount = Math.min(randInt(2, 5), inStock.length);
        const chosen = [...inStock].sort(() => Math.random() - 0.5).slice(0, productCount);

        const products = chosen.map((p) => {
            const available = stockMap[p.sku];
            const qty = Math.min(randInt(1, 10), available);
            stockMap[p.sku] = available - qty;
            return {
                productSku: p.sku,
                productName: p.name,
                productUnit: p.unitName,
                quantity: qty,
                sellingPrice: p.sellingPrice,
            };
        });

        await apiPost('/api/v2/invoices/selling', { products, taxFocus: false }, cashierToken);

        const totalQty = products.reduce((s, x) => s + x.quantity, 0);
        console.log(`  ✓ SEL-${String(i).padStart(5, '0')} (${products.length} products, qty ${totalQty})`);
    }

    // -----------------------------------------------------------------------
    // Done
    // -----------------------------------------------------------------------
    console.log('\n✅ API seed completed successfully!\n');
    console.log('Summary:');
    console.log(`  Users            : 4 (superuser, admin, manager, cashier)`);
    console.log(`  Product units    : ${PRODUCT_UNITS.length}`);
    console.log(`  Products         : ${PRODUCTS.length}`);
    console.log(`  Import invoices  : ${importCount}`);
    console.log(`  Selling invoices : ${sellingCount}`);
    console.log('');
}

seed().catch((err) => {
    console.error('\n❌ Seed failed:', err.message ?? err);
    process.exit(1);
});
