import { MigrationInterface, QueryRunner } from 'typeorm';

export class PRODUCTSv1CreateIndexes1775197789544 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // =============================================
        // --- PRODUCTS TABLE ---
        // =============================================

        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_is_active
            ON products (is_active)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_stock_status
            ON products (stock_status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_product_unit_id
            ON products (product_unit_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_created_at
            ON products (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_updated_at
            ON products (updated_at)
        `);

        // --- B-tree varchar_pattern_ops index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_sku_pattern
            ON products (sku varchar_pattern_ops)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_is_active_created_at
            ON products (is_active, created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_is_active_updated_at
            ON products (is_active, updated_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_is_active_sku
            ON products (is_active, sku)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_is_active_import_price
            ON products (is_active, import_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_is_active_selling_price
            ON products (is_active, selling_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_is_active_stock_status
            ON products (is_active, stock_status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_is_active_inventory_stock
            ON products (is_active, inventory_stock)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_products_product_unit_id_created_at
            ON products (product_unit_id, created_at DESC)
        `);

        // --- GIN index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_sku_trigram
            ON products USING GIN (sku gin_trgm_ops)
        `);

        // =============================================
        // --- PRODUCT NAMES TABLE ---
        // =============================================

        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_product_id
            ON product_names (product_id)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_product_id_name
            ON product_names (product_id, name)
        `);

        // --- B-tree varchar_pattern_ops index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_name_pattern
            ON product_names (name varchar_pattern_ops)
        `);

        // --- GIN index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_names_name_trigram
            ON product_names USING GIN (name gin_trgm_ops)
        `);

        // =============================================
        // --- PRODUCTS HISTORY TABLE ---
        // =============================================

        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_history_created_by
            ON products_history (created_by)
        `);

        // =============================================
        // --- PRODUCT STOCK HISTORY TABLE ---
        // =============================================

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_stock_history_product_id_created_at
            ON product_stock_history (product_id, created_at DESC)
        `);

        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_stock_history_reference_id
            ON product_stock_history (reference_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT STOCK HISTORY ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_stock_history_reference_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_stock_history_product_id_created_at`);

        // --- PRODUCTS HISTORY ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_history_created_by`);

        // --- PRODUCT NAMES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_name_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_name_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_product_id_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_names_product_id`);

        // --- PRODUCTS ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_product_unit_id_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active_inventory_stock`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active_stock_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active_selling_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active_import_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active_sku`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_sku_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_product_unit_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_stock_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_is_active`);
    }
}
