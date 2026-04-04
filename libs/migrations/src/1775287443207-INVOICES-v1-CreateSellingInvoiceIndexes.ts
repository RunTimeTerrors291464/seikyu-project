import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv1CreateSellingInvoiceIndexes1775287443207 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // =============================================
        // --- SELLING_INVOICE (getListOfSellingInvoices + generateInvoiceId) ---
        // =============================================

        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_invoice_id
            ON selling_invoice (invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_status
            ON selling_invoice (status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_confirmed_by
            ON selling_invoice (confirmed_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_confirmed_at
            ON selling_invoice (confirmed_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_created_at
            ON selling_invoice (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_total_selling_price
            ON selling_invoice (total_selling_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_total_products
            ON selling_invoice (total_products)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_total_quantity
            ON selling_invoice (total_quantity)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_return_count
            ON selling_invoice (return_count)
        `);

        // --- B-tree varchar_pattern_ops (prefix ILIKE on invoiceId) ---
        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_invoice_id_pattern
            ON selling_invoice (invoice_id varchar_pattern_ops)
        `);

        // --- GIN (ILIKE / flexible text on invoiceId; requires pg_trgm) ---
        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_invoice_id_trigram
            ON selling_invoice USING GIN (invoice_id gin_trgm_ops)
        `);

        // --- Multi column B-tree (list: created_at range + optional status + sort columns) ---
        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_status_total_selling_price
            ON selling_invoice (status, total_selling_price DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_status_total_products
            ON selling_invoice (status, total_products DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_status_total_quantity
            ON selling_invoice (status, total_quantity DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_status_return_count
            ON selling_invoice (status, return_count DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_status_created_at
            ON selling_invoice (status, created_at DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_status_confirmed_at
            ON selling_invoice (status, confirmed_at DESC)
        `);

        // =============================================
        // --- SELLING_INVOICE_PRODUCTS (EXISTS productId search + FK loads) ---
        // =============================================

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_products_selling_invoice_id
            ON selling_invoice_products (selling_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_products_product_id
            ON selling_invoice_products (product_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_selling_invoice_products_product_id_selling_invoice_id
            ON selling_invoice_products (product_id, selling_invoice_id)
        `);

        // =============================================
        // --- RETURN_SELLING_INVOICE (getListOfReturnSellingInvoices + generateReturnInvoiceId) ---
        // =============================================

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_return_invoice_id
            ON return_selling_invoice (return_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_selling_invoice_id
            ON return_selling_invoice (selling_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_status
            ON return_selling_invoice (status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_draft_by
            ON return_selling_invoice (draft_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_confirmed_by
            ON return_selling_invoice (confirmed_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_draft_at
            ON return_selling_invoice (draft_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_confirmed_at
            ON return_selling_invoice (confirmed_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_created_at
            ON return_selling_invoice (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_total_return_price
            ON return_selling_invoice (total_return_price)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_total_products
            ON return_selling_invoice (total_products)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_total_quantity
            ON return_selling_invoice (total_quantity)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_return_invoice_id_pattern
            ON return_selling_invoice (return_invoice_id varchar_pattern_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_return_invoice_id_trigram
            ON return_selling_invoice USING GIN (return_invoice_id gin_trgm_ops)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_status_total_return_price
            ON return_selling_invoice (status, total_return_price DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_status_total_products
            ON return_selling_invoice (status, total_products DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_status_total_quantity
            ON return_selling_invoice (status, total_quantity DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_status_created_at
            ON return_selling_invoice (status, created_at DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_status_draft_at
            ON return_selling_invoice (status, draft_at DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_status_confirmed_at
            ON return_selling_invoice (status, confirmed_at DESC)
        `);

        // =============================================
        // --- RETURN_SELLING_INVOICE_PRODUCTS (confirm load + EXISTS productId) ---
        // =============================================

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_products_return_selling_invoice_id
            ON return_selling_invoice_products (return_selling_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_products_selling_invoice_product_id
            ON return_selling_invoice_products (selling_invoice_product_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_products_product_id_return_selling_invoice_id
            ON return_selling_invoice_products (product_id, return_selling_invoice_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- RETURN_SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_products_product_id_return_selling_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_products_selling_invoice_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_products_return_selling_invoice_id`);

        // --- RETURN_SELLING_INVOICE ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status_total_return_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_return_invoice_id_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_return_invoice_id_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_total_return_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_selling_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_return_invoice_id`);

        // --- SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_products_product_id_selling_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_products_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_products_selling_invoice_id`);

        // --- SELLING_INVOICE ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_status_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_status_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_status_return_count`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_status_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_status_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_status_total_selling_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_invoice_id_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_invoice_id_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_return_count`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_total_quantity`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_total_products`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_total_selling_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_selling_invoice_invoice_id`);
    }
}
