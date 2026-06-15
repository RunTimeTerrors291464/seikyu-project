/**
 * Seed Script
 *
 * Seeds the following data directly into the database:
 *   - 4 users  : superuser, admin, manager, cashier
 *   - ~10 product units
 *   - 30 products (realistic Vietnamese retail store inventory)
 *   - 30 import invoices (CONFIRMED, stock updated)
 *   - 30 selling invoices (CONFIRMED, stock updated)
 *
 * Usage:
 *   npm run seed
 */

import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// ---------------------------------------------------------------------------
// DB connection helpers
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
// Tiny helpers
// ---------------------------------------------------------------------------

function env(key: string, fallback = ''): string {
    return process.env[key] ?? fallback;
}

function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n: number, width = 5): string {
    return String(n).padStart(width, '0');
}

// ---------------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------------

const PRODUCT_UNITS = [
    { name: 'Cái',   description: 'Đơn vị tính: cái / chiếc' },
    { name: 'Hộp',   description: 'Đơn vị tính: hộp' },
    { name: 'Chai',  description: 'Đơn vị tính: chai' },
    { name: 'Gói',   description: 'Đơn vị tính: gói / túi nhỏ' },
    { name: 'Lon',   description: 'Đơn vị tính: lon' },
    { name: 'Túi',   description: 'Đơn vị tính: túi' },
    { name: 'Cuộn',  description: 'Đơn vị tính: cuộn' },
    { name: 'Kg',    description: 'Đơn vị tính: kilogram' },
    { name: 'Lít',   description: 'Đơn vị tính: lít' },
    { name: 'Bộ',    description: 'Đơn vị tính: bộ / set' },
];

interface ProductSeed {
    sku: string;
    names: string[];
    unitName: string;
    description: string;
    importPrice: number;
    sellingPrice: number;
    reorderThreshold: number;
}

const PRODUCTS: ProductSeed[] = [
    {
        sku: '8934588012345',
        names: ['Nước suối Aquafina 500ml', 'Aquafina Drinking Water 500ml'],
        unitName: 'Chai',
        description: 'Nước uống tinh khiết Aquafina, chai 500ml',
        importPrice: 5000,  sellingPrice: 8000,  reorderThreshold: 50,
    },
    {
        sku: '5449000000996',
        names: ['Coca-Cola 330ml', 'Coke 330ml Can'],
        unitName: 'Lon',
        description: 'Nước ngọt có gas Coca-Cola, lon 330ml',
        importPrice: 9000,  sellingPrice: 14000, reorderThreshold: 40,
    },
    {
        sku: '5449000025098',
        names: ['Pepsi 330ml', 'Pepsi Cola 330ml'],
        unitName: 'Lon',
        description: 'Nước ngọt có gas Pepsi, lon 330ml',
        importPrice: 8500,  sellingPrice: 13000, reorderThreshold: 40,
    },
    {
        sku: '8934673640015',
        names: ['Sữa tươi Vinamilk 1L', 'Vinamilk Fresh Milk 1L'],
        unitName: 'Hộp',
        description: 'Sữa tươi tiệt trùng Vinamilk, hộp giấy 1 lít',
        importPrice: 28000, sellingPrice: 36000, reorderThreshold: 30,
    },
    {
        sku: '8934563130016',
        names: ['Mì gói Hảo Hảo tôm chua cay', 'Hao Hao Noodles Shrimp Spicy'],
        unitName: 'Gói',
        description: 'Mì ăn liền Hảo Hảo vị tôm chua cay, gói 74g',
        importPrice: 4500,  sellingPrice: 6500,  reorderThreshold: 100,
    },
    {
        sku: '8934678000017',
        names: ['Trứng gà ta (vỉ 10 quả)', 'Fresh Farm Eggs x10'],
        unitName: 'Vỉ',
        description: 'Trứng gà tươi, vỉ 10 quả',
        importPrice: 30000, sellingPrice: 38000, reorderThreshold: 20,
    },
    {
        sku: '8934822000018',
        names: ['Dầu ăn Neptune 1L', 'Neptune Cooking Oil 1L'],
        unitName: 'Chai',
        description: 'Dầu ăn Neptune tinh luyện, chai nhựa 1 lít',
        importPrice: 42000, sellingPrice: 55000, reorderThreshold: 20,
    },
    {
        sku: '8934675000019',
        names: ['Nước mắm Chin-su 500ml', 'Chinsu Fish Sauce 500ml'],
        unitName: 'Chai',
        description: 'Nước mắm Chin-su cao cấp, chai 500ml, độ đạm 40N',
        importPrice: 32000, sellingPrice: 42000, reorderThreshold: 25,
    },
    {
        sku: '8934568000020',
        names: ['Gạo ST25 túi 5kg', 'ST25 Premium Rice 5kg'],
        unitName: 'Túi',
        description: 'Gạo ST25 thơm ngon, túi 5kg',
        importPrice: 95000, sellingPrice: 120000, reorderThreshold: 15,
    },
    {
        sku: '8935001000021',
        names: ['Đường cát trắng Biên Hòa 1kg', 'Bien Hoa White Sugar 1kg'],
        unitName: 'Túi',
        description: 'Đường cát trắng tinh luyện Biên Hòa, túi 1kg',
        importPrice: 22000, sellingPrice: 28000, reorderThreshold: 30,
    },
    {
        sku: '8934522000022',
        names: ['Bột ngọt Ajinomoto 200g', 'Ajinomoto MSG 200g'],
        unitName: 'Gói',
        description: 'Bột ngọt Ajinomoto chính hãng, gói 200g',
        importPrice: 18000, sellingPrice: 25000, reorderThreshold: 30,
    },
    {
        sku: '8934001000023',
        names: ['Xà phòng Dove dưỡng ẩm 100g', 'Dove Moisturizing Bar 100g'],
        unitName: 'Cái',
        description: 'Xà phòng bánh Dove dưỡng ẩm, 100g',
        importPrice: 18000, sellingPrice: 26000, reorderThreshold: 30,
    },
    {
        sku: '8934867000024',
        names: ['Kem đánh răng P/S 120g', 'P/S Toothpaste 120g'],
        unitName: 'Hộp',
        description: 'Kem đánh răng P/S bảo vệ răng chắc khỏe, 120g',
        importPrice: 20000, sellingPrice: 28000, reorderThreshold: 25,
    },
    {
        sku: '8934501000025',
        names: ['Dầu gội Sunsilk mềm mượt 330ml', 'Sunsilk Shampoo Smooth 330ml'],
        unitName: 'Chai',
        description: 'Dầu gội Sunsilk dưỡng mượt, chai 330ml',
        importPrice: 55000, sellingPrice: 72000, reorderThreshold: 20,
    },
    {
        sku: '8934678900026',
        names: ['Nước rửa chén Sunlight 750ml', 'Sunlight Dishwash Liquid 750ml'],
        unitName: 'Chai',
        description: 'Nước rửa chén Sunlight hương chanh, chai 750ml',
        importPrice: 26000, sellingPrice: 36000, reorderThreshold: 25,
    },
    {
        sku: '8934800000027',
        names: ['Giấy vệ sinh Bless You 10 cuộn', 'Bless You Toilet Paper x10'],
        unitName: 'Bộ',
        description: 'Giấy vệ sinh Bless You 2 lớp, lốc 10 cuộn',
        importPrice: 55000, sellingPrice: 75000, reorderThreshold: 15,
    },
    {
        sku: '8934551000028',
        names: ['Sữa đặc Ông Thọ lon xanh 380g', 'Ong Tho Condensed Milk 380g'],
        unitName: 'Lon',
        description: 'Sữa đặc có đường Ông Thọ, lon 380g',
        importPrice: 22000, sellingPrice: 30000, reorderThreshold: 30,
    },
    {
        sku: '8934561000029',
        names: ['Cà phê G7 3in1 (hộp 50 gói)', 'G7 3in1 Instant Coffee x50'],
        unitName: 'Hộp',
        description: 'Cà phê hòa tan G7 3in1, hộp 50 gói x 16g',
        importPrice: 95000, sellingPrice: 125000, reorderThreshold: 20,
    },
    {
        sku: '8934010000030',
        names: ['Trà xanh 0 độ 450ml', '0 Degree Green Tea 450ml'],
        unitName: 'Chai',
        description: 'Trà xanh không đường 0 Độ, chai 450ml',
        importPrice: 8500,  sellingPrice: 13000, reorderThreshold: 40,
    },
    {
        sku: '5099873004040',
        names: ['Red Bull 250ml', 'Red Bull Energy Drink 250ml'],
        unitName: 'Lon',
        description: 'Nước tăng lực Red Bull, lon 250ml',
        importPrice: 10500, sellingPrice: 15000, reorderThreshold: 40,
    },
    {
        sku: '8934690000041',
        names: ['Snack Poca vị tôm 30g', 'Poca Shrimp Chips 30g'],
        unitName: 'Gói',
        description: 'Bánh snack khoai tây Poca vị tôm, gói 30g',
        importPrice: 9000,  sellingPrice: 13000, reorderThreshold: 50,
    },
    {
        sku: '7622200166399',
        names: ['Kẹo cao su Doublemint 5 thanh', 'Doublemint Chewing Gum 5pcs'],
        unitName: 'Gói',
        description: 'Kẹo cao su Doublemint hương bạc hà, 5 thanh',
        importPrice: 5000,  sellingPrice: 7000,  reorderThreshold: 60,
    },
    {
        sku: '8934673500043',
        names: ['Bánh quy Kinh Đô hộp 400g', 'Kinh Do Cookies 400g'],
        unitName: 'Hộp',
        description: 'Bánh quy bơ Kinh Đô, hộp thiếc 400g',
        importPrice: 65000, sellingPrice: 85000, reorderThreshold: 15,
    },
    {
        sku: '0041333422220',
        names: ['Pin AA Duracell (vỉ 4 viên)', 'Duracell AA Batteries x4'],
        unitName: 'Vỉ',
        description: 'Pin kiềm AA Duracell, vỉ 4 viên',
        importPrice: 38000, sellingPrice: 55000, reorderThreshold: 20,
    },
    {
        sku: '8934867110045',
        names: ['Nước giặt Omo Matic 3kg', 'Omo Matic Laundry 3kg'],
        unitName: 'Túi',
        description: 'Bột giặt máy Omo Matic cửa trước, túi 3kg',
        importPrice: 115000, sellingPrice: 150000, reorderThreshold: 10,
    },
    {
        sku: '8934588020046',
        names: ['Nước ngọt Sting dâu 330ml', 'Sting Strawberry Energy 330ml'],
        unitName: 'Lon',
        description: 'Nước tăng lực Sting hương dâu, lon 330ml',
        importPrice: 8000,  sellingPrice: 12000, reorderThreshold: 40,
    },
    {
        sku: '8934009000047',
        names: ['Bánh mì sandwich Kinh Đô', 'Kinh Do Sandwich Bread'],
        unitName: 'Gói',
        description: 'Bánh mì sandwich Kinh Đô, gói 300g',
        importPrice: 20000, sellingPrice: 28000, reorderThreshold: 20,
    },
    {
        sku: '8934590000048',
        names: ['Khăn giấy Tempo 3 lớp (hộp 200 tờ)', 'Tempo Facial Tissue 3-ply 200s'],
        unitName: 'Hộp',
        description: 'Khăn giấy Tempo mềm mại 3 lớp, hộp 200 tờ',
        importPrice: 28000, sellingPrice: 40000, reorderThreshold: 20,
    },
    {
        sku: '8934623000049',
        names: ['Nước tương Maggi 700ml', 'Maggi Soy Sauce 700ml'],
        unitName: 'Chai',
        description: 'Nước tương Maggi đậu nành, chai 700ml',
        importPrice: 28000, sellingPrice: 38000, reorderThreshold: 25,
    },
    {
        sku: '8934004000050',
        names: ['Bia Tiger lon 330ml', 'Tiger Beer Can 330ml'],
        unitName: 'Lon',
        description: 'Bia Tiger lager cao cấp, lon 330ml',
        importPrice: 14000, sellingPrice: 20000, reorderThreshold: 48,
    },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
    console.log('\n🌱 Starting database seed...\n');

    const client = await createClient();

    try {
        await client.query('BEGIN');

        // ---------------------------------------------------------------
        // 1. Seed Users
        // ---------------------------------------------------------------
        console.log('👤 Seeding users...');

        const SALT_ROUNDS = 12;
        const now = new Date().toISOString();

        const users = [
            {
                firstName: 'Super',
                middleName: null,
                lastName: 'User',
                username: env('SEED_SUPERUSER_USERNAME', 'superuser'),
                password: await bcrypt.hash(env('SEED_SUPERUSER_PASSWORD', 'superuser123'), SALT_ROUNDS),
                isAdmin: true, isManager: true, isCashier: true,
            },
            {
                firstName: 'Admin',
                middleName: null,
                lastName: null,
                username: env('SEED_ADMIN_USERNAME', 'admin'),
                password: await bcrypt.hash(env('SEED_ADMIN_PASSWORD', 'admin123'), SALT_ROUNDS),
                isAdmin: true, isManager: false, isCashier: false,
            },
            {
                firstName: 'Manager',
                middleName: null,
                lastName: null,
                username: env('SEED_MANAGER_USERNAME', 'manager'),
                password: await bcrypt.hash(env('SEED_MANAGER_PASSWORD', 'manager123'), SALT_ROUNDS),
                isAdmin: false, isManager: true, isCashier: false,
            },
            {
                firstName: 'Cashier',
                middleName: null,
                lastName: null,
                username: env('SEED_CASHIER_USERNAME', 'cashier'),
                password: await bcrypt.hash(env('SEED_CASHIER_PASSWORD', 'cashier123'), SALT_ROUNDS),
                isAdmin: false, isManager: false, isCashier: true,
            },
        ];

        const seededUserIds: Record<string, string> = {};

        for (const u of users) {
            const existing = await client.query(
                `SELECT id FROM users WHERE username = $1`,
                [u.username],
            );

            if (existing.rowCount && existing.rowCount > 0) {
                seededUserIds[u.username] = existing.rows[0].id;
                console.log(`  ↳ Skipped (already exists): ${u.username}`);
                continue;
            }

            const res = await client.query(
                `INSERT INTO users
                    (first_name, middle_name, last_name, username, password,
                     is_active, is_admin, is_manager, is_cashier, created_at, updated_at, version)
                 VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,$9,$10,1)
                 RETURNING id`,
                [u.firstName, u.middleName, u.lastName, u.username, u.password,
                 u.isAdmin, u.isManager, u.isCashier, now, now],
            );

            seededUserIds[u.username] = res.rows[0].id;
            console.log(`  ✓ Created user: ${u.username}`);
        }

        const superuserId  = seededUserIds[env('SEED_SUPERUSER_USERNAME', 'superuser')];
        const managerId    = seededUserIds[env('SEED_MANAGER_USERNAME', 'manager')];
        const cashierId    = seededUserIds[env('SEED_CASHIER_USERNAME', 'cashier')];

        // ---------------------------------------------------------------
        // 2. Seed Product Units
        // ---------------------------------------------------------------
        console.log('\n📦 Seeding product units...');

        const unitIdByName: Record<string, string> = {};

        for (const pu of PRODUCT_UNITS) {
            const existing = await client.query(
                `SELECT id FROM product_units WHERE unit_name = $1`,
                [pu.name],
            );

            if (existing.rowCount && existing.rowCount > 0) {
                unitIdByName[pu.name] = existing.rows[0].id;
                console.log(`  ↳ Skipped (already exists): ${pu.name}`);
                continue;
            }

            const res = await client.query(
                `INSERT INTO product_units (unit_name, unit_description, is_active, created_at, updated_at)
                 VALUES ($1,$2,true,$3,$4)
                 RETURNING id`,
                [pu.name, pu.description, now, now],
            );

            unitIdByName[pu.name] = res.rows[0].id;
            console.log(`  ✓ Created unit: ${pu.name}`);
        }

        // Ensure "Vỉ" unit exists (used by eggs and batteries)
        if (!unitIdByName['Vỉ']) {
            const res = await client.query(
                `INSERT INTO product_units (unit_name, unit_description, is_active, created_at, updated_at)
                 VALUES ($1,$2,true,$3,$4)
                 RETURNING id`,
                ['Vỉ', 'Đơn vị tính: vỉ / blister', now, now],
            );
            unitIdByName['Vỉ'] = res.rows[0].id;
            console.log(`  ✓ Created unit: Vỉ`);
        }

        // ---------------------------------------------------------------
        // 3. Seed Products
        // ---------------------------------------------------------------
        console.log('\n🛒 Seeding products...');

        // StockStatus: 0=IN_STOCK, 1=REORDER_THRESHOLD, 2=OUT_OF_STOCK
        const seededProducts: Array<{
            id: string;
            sku: string;
            name: string;
            unitName: string;
            importPrice: number;
            sellingPrice: number;
            reorderThreshold: number;
            inventoryStock: number;
        }> = [];

        for (const p of PRODUCTS) {
            const existing = await client.query(
                `SELECT id, inventory_stock FROM products WHERE sku = $1`,
                [p.sku],
            );

            // Resolve unit – fall back to first available unit if not mapped
            const unitId = unitIdByName[p.unitName] ?? Object.values(unitIdByName)[0];
            const mainName = p.names[0];

            if (existing.rowCount && existing.rowCount > 0) {
                seededProducts.push({
                    id: existing.rows[0].id,
                    sku: p.sku,
                    name: mainName,
                    unitName: p.unitName,
                    importPrice: p.importPrice,
                    sellingPrice: p.sellingPrice,
                    reorderThreshold: p.reorderThreshold,
                    inventoryStock: Number(existing.rows[0].inventory_stock),
                });
                console.log(`  ↳ Skipped (already exists): ${mainName}`);
                continue;
            }

            const productRes = await client.query(
                `INSERT INTO products
                    (sku, product_unit_id, product_description,
                     import_price, selling_price, reorder_threshold,
                     inventory_stock, is_active, stock_status, created_at, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6,0,true,2,$7,$8)
                 RETURNING id`,
                [p.sku, unitId, p.description,
                 p.importPrice, p.sellingPrice, p.reorderThreshold,
                 now, now],
            );

            const productId = productRes.rows[0].id;

            // Insert product names
            for (let i = 0; i < p.names.length; i++) {
                await client.query(
                    `INSERT INTO product_names (product_id, name, is_main, created_at, updated_at)
                     VALUES ($1,$2,$3,$4,$5)`,
                    [productId, p.names[i], i === 0, now, now],
                );
            }

            seededProducts.push({
                id: productId,
                sku: p.sku,
                name: mainName,
                unitName: p.unitName,
                importPrice: p.importPrice,
                sellingPrice: p.sellingPrice,
                reorderThreshold: p.reorderThreshold,
                inventoryStock: 0,
            });

            console.log(`  ✓ Created product: ${mainName} (${p.sku})`);
        }

        // ---------------------------------------------------------------
        // 4. Seed Import Invoices (30, CONFIRMED)
        // ---------------------------------------------------------------
        console.log('\n📥 Seeding import invoices...');

        const importCount = parseInt(env('SEED_IMPORT_INVOICES', '30'), 10);

        // Keep a mutable stock map so selling invoices can be based on real stock
        const stockMap: Record<string, number> = {};
        for (const p of seededProducts) stockMap[p.id] = p.inventoryStock;

        for (let i = 1; i <= importCount; i++) {
            const invoiceId = `IMP-2025-${pad(i)}`;
            const confirmedAt = new Date(
                Date.now() - randInt(1, 180) * 24 * 60 * 60 * 1000,
            ).toISOString();

            // Pick 2–5 distinct products for this invoice
            const productCount = randInt(2, 5);
            const shuffled = [...seededProducts].sort(() => Math.random() - 0.5);
            const chosen = shuffled.slice(0, productCount);

            let totalProducts = chosen.length;
            let totalQuantity = 0;
            let totalImportPrice = 0;

            interface InvoiceLineItem {
                productId: string;
                sku: string;
                name: string;
                unitName: string;
                qty: number;
                importPrice: number;
                lineTotal: number;
            }
            const lineItems: InvoiceLineItem[] = [];

            for (const prod of chosen) {
                const qty = randInt(10, 100);
                const lineTotal = parseFloat((qty * prod.importPrice).toFixed(2));
                totalQuantity += qty;
                totalImportPrice = parseFloat((totalImportPrice + lineTotal).toFixed(2));
                lineItems.push({
                    productId: prod.id,
                    sku: prod.sku,
                    name: prod.name,
                    unitName: prod.unitName,
                    qty,
                    importPrice: prod.importPrice,
                    lineTotal,
                });
            }

            // Insert invoice
            const invRes = await client.query(
                `INSERT INTO import_invoice
                    (invoice_id, total_products, total_quantity, total_import_price,
                     notes, status, return_count,
                     draft_by, draft_at, confirmed_by, confirmed_at, created_at)
                 VALUES ($1,$2,$3,$4,$5,'confirmed',0,$6,$7,$8,$9,$10)
                 RETURNING id`,
                [
                    invoiceId, totalProducts, totalQuantity, totalImportPrice,
                    null,
                    managerId, confirmedAt,
                    managerId, confirmedAt,
                    confirmedAt,
                ],
            );
            const importInvoiceDbId = invRes.rows[0].id;

            // Insert line items + update product stock
            for (const line of lineItems) {
                await client.query(
                    `INSERT INTO import_invoice_products
                        (import_invoice_id, product_id, product_sku, product_name, product_unit,
                         quantity, returned_quantity, import_price, total_import_price, notes)
                     VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,null)`,
                    [
                        importInvoiceDbId, line.productId, line.sku, line.name, line.unitName,
                        line.qty, line.importPrice, line.lineTotal,
                    ],
                );

                const before = stockMap[line.productId];
                const after  = before + line.qty;
                stockMap[line.productId] = after;

                // Determine stock_status
                const threshold = seededProducts.find(p => p.id === line.productId)?.reorderThreshold ?? 0;
                const newStatus = after === 0 ? 2 : after <= threshold ? 1 : 0;

                await client.query(
                    `UPDATE products SET inventory_stock=$1, stock_status=$2, updated_at=$3 WHERE id=$4`,
                    [after, newStatus, confirmedAt, line.productId],
                );

                await client.query(
                    `INSERT INTO product_stock_history
                        (product_id, quantity_type, quantity, invoice_type, invoice_id,
                         before_inventory_stock, after_inventory_stock, created_at)
                     VALUES ($1,'add',$2,'import',$3,$4,$5,$6)`,
                    [line.productId, line.qty, importInvoiceDbId, before, after, confirmedAt],
                );
            }

            console.log(`  ✓ Import invoice ${invoiceId} (${totalProducts} products, qty ${totalQuantity})`);
        }

        // ---------------------------------------------------------------
        // 5. Seed Selling Invoices (30, CONFIRMED)
        // ---------------------------------------------------------------
        console.log('\n🛍️  Seeding selling invoices...');

        const sellingCount = parseInt(env('SEED_SELLING_INVOICES', '30'), 10);

        for (let i = 1; i <= sellingCount; i++) {
            const invoiceId = `SEL-2025-${pad(i)}`;
            const confirmedAt = new Date(
                Date.now() - randInt(1, 60) * 24 * 60 * 60 * 1000,
            ).toISOString();

            // Only sell products that have stock > 0
            const inStockProducts = seededProducts.filter(p => (stockMap[p.id] ?? 0) > 0);
            if (inStockProducts.length === 0) {
                console.log(`  ↳ No products in stock, skipping selling invoice ${invoiceId}`);
                continue;
            }

            const productCount = Math.min(randInt(2, 5), inStockProducts.length);
            const shuffled = [...inStockProducts].sort(() => Math.random() - 0.5);
            const chosen = shuffled.slice(0, productCount);

            let totalProducts = chosen.length;
            let totalQuantity = 0;
            let totalSellingPrice = 0;

            interface SellingLineItem {
                productId: string;
                sku: string;
                name: string;
                unitName: string;
                qty: number;
                sellingPrice: number;
                lineTotal: number;
            }
            const lineItems: SellingLineItem[] = [];

            for (const prod of chosen) {
                const available = stockMap[prod.id];
                const qty = Math.min(randInt(1, 20), available);
                const lineTotal = parseFloat((qty * prod.sellingPrice).toFixed(2));
                totalQuantity += qty;
                totalSellingPrice = parseFloat((totalSellingPrice + lineTotal).toFixed(2));
                lineItems.push({
                    productId: prod.id,
                    sku: prod.sku,
                    name: prod.name,
                    unitName: prod.unitName,
                    qty,
                    sellingPrice: prod.sellingPrice,
                    lineTotal,
                });
            }

            const invRes = await client.query(
                `INSERT INTO selling_invoice
                    (invoice_id, total_products, total_quantity, invoice_discount,
                     total_selling_price, notes, status, return_count,
                     tax_focus, confirmed_by, confirmed_at, created_at)
                 VALUES ($1,$2,$3,0,$4,null,'confirmed',0,false,$5,$6,$7)
                 RETURNING id`,
                [
                    invoiceId, totalProducts, totalQuantity,
                    totalSellingPrice,
                    cashierId, confirmedAt, confirmedAt,
                ],
            );
            const sellingInvoiceDbId = invRes.rows[0].id;

            for (const line of lineItems) {
                await client.query(
                    `INSERT INTO selling_invoice_products
                        (selling_invoice_id, product_id, product_sku, product_name, product_unit,
                         quantity, return_quantity, selling_price, product_discount,
                         total_selling_price, notes)
                     VALUES ($1,$2,$3,$4,$5,$6,0,$7,0,$8,null)`,
                    [
                        sellingInvoiceDbId, line.productId, line.sku, line.name, line.unitName,
                        line.qty, line.sellingPrice, line.lineTotal,
                    ],
                );

                const before = stockMap[line.productId];
                const after  = Math.max(0, before - line.qty);
                stockMap[line.productId] = after;

                const threshold = seededProducts.find(p => p.id === line.productId)?.reorderThreshold ?? 0;
                const newStatus = after === 0 ? 2 : after <= threshold ? 1 : 0;

                await client.query(
                    `UPDATE products SET inventory_stock=$1, stock_status=$2, updated_at=$3 WHERE id=$4`,
                    [after, newStatus, confirmedAt, line.productId],
                );

                await client.query(
                    `INSERT INTO product_stock_history
                        (product_id, quantity_type, quantity, invoice_type, invoice_id,
                         before_inventory_stock, after_inventory_stock, created_at)
                     VALUES ($1,'subtract',$2,'selling',$3,$4,$5,$6)`,
                    [line.productId, line.qty, sellingInvoiceDbId, before, after, confirmedAt],
                );
            }

            console.log(`  ✓ Selling invoice ${invoiceId} (${totalProducts} products, qty ${totalQuantity})`);
        }

        // ---------------------------------------------------------------
        // Commit
        // ---------------------------------------------------------------
        await client.query('COMMIT');

        console.log('\n✅ Seed completed successfully!\n');
        console.log('Summary:');
        console.log(`  Users   : ${users.length}`);
        console.log(`  Units   : ${PRODUCT_UNITS.length + 1}`);
        console.log(`  Products: ${seededProducts.length}`);
        console.log(`  Import invoices : ${importCount}`);
        console.log(`  Selling invoices: ${sellingCount}`);
        console.log('');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ Seed failed — transaction rolled back');
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seed();
