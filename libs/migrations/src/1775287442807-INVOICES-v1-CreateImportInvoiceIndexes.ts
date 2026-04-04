import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv1CreateImportInvoiceIndexes1775287442807 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // =============================================
        // IMPORT_INVOICE
        // =============================================

        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_invoice_id
            ON import_invoice (invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_status
            ON import_invoice (status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_draft_by
            ON import_invoice (draft_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_confirmed_by
            ON import_invoice (confirmed_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_draft_at
            ON import_invoice (draft_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_confirmed_at
            ON import_invoice (confirmed_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_created_at
            ON import_invoice (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_total_import_price
            ON import_invoice (total_import_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_total_products
            ON import_invoice (total_products)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_total_quantity
            ON import_invoice (total_quantity)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_return_count
            ON import_invoice (return_count)
        `);

        // --- B-tree varchar_pattern_ops (prefix ILIKE on invoiceId) ---
        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_invoice_id_pattern
            ON import_invoice (invoice_id varchar_pattern_ops)
        `);

        // --- GIN index (ILIKE / flexible text match on invoiceId) ---
        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_invoice_id_trigram
            ON import_invoice USING GIN (invoice_id gin_trgm_ops)
        `);

        // --- Multi column B-tree (list API: required created_at range + optional status + sort columns) ---
        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_status_total_import_price
            ON import_invoice (status, total_import_price DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_status_total_products
            ON import_invoice (status, total_products DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_status_total_quantity
            ON import_invoice (status, total_quantity DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_status_return_count
            ON import_invoice (status, return_count DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_status_created_at
            ON import_invoice (status, created_at DESC)
        `);

        // =============================================
        // IMPORT_INVOICE_PRODUCTS
        // =============================================

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_products_import_invoice_id
            ON import_invoice_products (import_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_products_product_id
            ON import_invoice_products (product_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_products_product_id_import_invoice_id
            ON import_invoice_products (product_id, import_invoice_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- IMPORT_INVOICE_PRODUCTS ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_products_product_id_import_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_products_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_products_import_invoice_id`);

        // --- IMPORT_INVOICE ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_status_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_status_return_count`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_status_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_status_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_status_total_import_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_invoice_id_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_invoice_id_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_return_count`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_total_import_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_invoice_id`);
    }
}
