import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexProductHistoryTablesV11771767251760 implements MigrationInterface {
    name = 'AddIndexProductHistoryTablesV11771767251760'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT_UNITS_HISTORY INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_history_product_unit_id 
            ON product_units_history (product_unit_id)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_history_product_unit_id_version 
            ON product_units_history (product_unit_id, version)
        `);

        // --- PRODUCTS_HISTORY INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_history_product_id 
            ON products_history (product_id)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_products_history_product_id_version 
            ON products_history (product_id, version)
        `);

        // --- PRODUCT_STOCK_HISTORY INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_stock_history_product_id 
            ON product_stock_history (product_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_stock_history_created_at 
            ON product_stock_history (created_at)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_stock_history_product_id_created_at 
            ON product_stock_history (product_id, created_at)
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT_STOCK_HISTORY INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_stock_history_product_id_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_stock_history_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_stock_history_product_id`);

        // --- PRODUCTS_HISTORY INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_history_product_id_version`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_products_history_product_id`);

        // --- PRODUCT_UNITS_HISTORY INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_history_product_unit_id_version`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_history_product_unit_id`);

    }

}
