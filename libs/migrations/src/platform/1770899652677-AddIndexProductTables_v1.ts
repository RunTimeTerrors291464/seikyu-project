import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexProductTablesV11770899652677 implements MigrationInterface {
    name = 'AddIndexProductTablesV11770899652677'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        // Install pg_trgm extension and unaccent extension.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // --- PRODUCT_UNITS INDEXES ---
        // --- Single column B-tree index ---
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

        // --- GIN Trigram Index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_unit_name_trigram 
            ON product_units USING GIN (unit_name gin_trgm_ops)
        `);

        // --- PRODUCT_NAMES INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_product_id 
            ON product_names (product_id)
        `);

        // --- GIN Trigram Index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_name_trigram 
            ON product_names USING GIN (name gin_trgm_ops)
        `);

        // --- PRODUCTS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_product_unit 
            ON products (product_unit)
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
            CREATE INDEX idx_products_import_price 
            ON products (import_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_selling_price 
            ON products (selling_price)
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
            CREATE INDEX idx_products_active_stock_status 
            ON products (active, stock_status)
        `);

        // --- GIN Trigram Index ---
        await queryRunner.query(`
             CREATE INDEX idx_products_sku_trigram 
             ON products USING GIN (sku gin_trgm_ops)
        `);

        // --- PRODUCTS_HISTORY INDEXES ---
        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_history_product_id_version 
            ON products_history (product_id, version DESC)
        `);

        // --- PRODUCT_UNITS_HISTORY INDEXES ---
        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_history_product_unit_id_version 
            ON product_units_history (product_unit_id, version DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCTS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active_stock_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_selling_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_import_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_stock_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_active`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_product_unit`);

        // --- PRODUCT_NAMES INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_name_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_product_id`);

        // --- PRODUCT_UNITS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_unit_name_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_active`);

        // --- PRODUCTS_HISTORY INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_history_product_id_version`);

        // --- PRODUCT_UNITS_HISTORY INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_history_product_unit_id_version`);
    }

}
