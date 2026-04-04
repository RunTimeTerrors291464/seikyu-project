import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv1CreateReturnImportInvoiceIndexes1775287443007 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // =============================================
        // RETURN_IMPORT_INVOICE
        // =============================================

        // --- Single column B-tree (FK join, filters, sorts, generateReturnInvoiceId lookup) ---
        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_return_invoice_id
            ON return_import_invoice (return_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_import_invoice_id
            ON return_import_invoice (import_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_status
            ON return_import_invoice (status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_draft_by
            ON return_import_invoice (draft_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_confirmed_by
            ON return_import_invoice (confirmed_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_draft_at
            ON return_import_invoice (draft_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_confirmed_at
            ON return_import_invoice (confirmed_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_created_at
            ON return_import_invoice (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_total_return_price
            ON return_import_invoice (total_return_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_total_products
            ON return_import_invoice (total_products)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_total_quantity
            ON return_import_invoice (total_quantity)
        `);

        // --- B-tree varchar_pattern_ops (prefix ILIKE on returnInvoiceId, LIKE in generateReturnInvoiceId) ---
        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_return_invoice_id_pattern
            ON return_import_invoice (return_invoice_id varchar_pattern_ops)
        `);

        // --- GIN (ILIKE / flexible text on returnInvoiceId; requires pg_trgm — enabled in USERS migration) ---
        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_return_invoice_id_trigram
            ON return_import_invoice USING GIN (return_invoice_id gin_trgm_ops)
        `);

        // --- Multi column B-tree (list API: optional status + sort columns, same idea as import_invoice) ---
        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_status_total_return_price
            ON return_import_invoice (status, total_return_price DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_status_total_products
            ON return_import_invoice (status, total_products DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_status_total_quantity
            ON return_import_invoice (status, total_quantity DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_status_created_at
            ON return_import_invoice (status, created_at DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_status_draft_at
            ON return_import_invoice (status, draft_at DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_status_confirmed_at
            ON return_import_invoice (status, confirmed_at DESC)
        `);

        // =============================================
        // RETURN_IMPORT_INVOICE_PRODUCTS
        // =============================================

        // Load / delete lines by return header; confirm flow loads by return_import_invoice_id
        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_products_return_import_invoice_id
            ON return_import_invoice_products (return_import_invoice_id)
        `);

        // FK to import line
        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_products_import_invoice_product_id
            ON return_import_invoice_products (import_invoice_product_id)
        `);

        // EXISTS (product_id = :search AND return_import_invoice_id = invoice.id) in getListOfReturnImportInvoices
        await queryRunner.query(`
            CREATE INDEX idx_return_import_invoice_products_product_id_return_import_invoice_id
            ON return_import_invoice_products (product_id, return_import_invoice_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_products_product_id_return_import_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_products_import_invoice_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_products_return_import_invoice_id`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_status_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_status_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_status_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_status_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_status_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_status_total_return_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_return_invoice_id_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_return_invoice_id_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_total_return_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_import_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_import_invoice_return_invoice_id`);
    }
}
