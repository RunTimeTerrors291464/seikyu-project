import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexProductTablesV11771766763164 implements MigrationInterface {
    name = 'AddIndexProductTablesV11771766763164'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        // Install pg_trgm extension for trigram search.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // --- PRODUCT_UNITS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_unit_name 
            ON product_units (unit_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_active 
            ON product_units (active)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_created_at 
            ON product_units (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_updated_at 
            ON product_units (updated_at)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_active_unit_name 
            ON product_units (active, unit_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_active_created_at 
            ON product_units (active, created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_active_updated_at 
            ON product_units (active, updated_at)
        `);

        // --- B-tree text-pattern-ops ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_unit_name_pattern 
            ON product_units (unit_name varchar_pattern_ops)
        `);

        // --- GIN index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_unit_name_trigram 
            ON product_units USING GIN (unit_name gin_trgm_ops)
        `);

        // --- PRODUCTS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_product_unit 
            ON products (product_unit)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_import_price 
            ON products (import_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_selling_price 
            ON products (selling_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_active 
            ON products (active)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_stock_status 
            ON products (stock_status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_created_at 
            ON products (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_updated_at 
            ON products (updated_at)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_active_product_unit 
            ON products (active, product_unit)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_active_import_price 
            ON products (active, import_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_active_selling_price 
            ON products (active, selling_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_active_stock_status 
            ON products (active, stock_status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_active_created_at 
            ON products (active, created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_active_updated_at 
            ON products (active, updated_at)
        `);

        // --- B-tree text-pattern-ops ---
        await queryRunner.query(`
            CREATE INDEX idx_products_sku_pattern 
            ON products (sku varchar_pattern_ops)
        `);

        // --- GIN index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_sku_trigram 
            ON products USING GIN (sku gin_trgm_ops)
        `);

        // --- PRODUCT_NAMES INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_product_id 
            ON product_names (product_id)
        `);

        // --- B-tree text-pattern-ops ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_name_pattern 
            ON product_names (name varchar_pattern_ops)
        `);

        // --- GIN index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_name_trigram 
            ON product_names USING GIN (name gin_trgm_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT_NAMES INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_name_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_name_pattern`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_product_id`);

        // --- PRODUCTS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku_pattern`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active_stock_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active_selling_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active_import_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active_product_unit`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_stock_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_selling_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_import_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_product_unit`);

        // --- PRODUCT_UNITS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_unit_name_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_unit_name_pattern`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_active_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_active_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_active_unit_name`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_active`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_unit_name`);
    }

}
