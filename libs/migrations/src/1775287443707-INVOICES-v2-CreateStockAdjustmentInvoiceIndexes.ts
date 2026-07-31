import { MigrationInterface, QueryRunner } from 'typeorm';

// stock_adjustment_invoice was created without any index besides its primary key, unlike
// selling_invoice and import_invoice. This fills the gaps that cost the most:
//
//   - generateInvoiceId() runs `invoice_id LIKE 'SA26-%'` inside the confirm transaction while
//     holding a pg advisory lock, so a sequential scan there serializes every confirm.
//   - searchBy invoiceId / userId had no index at all.
//
// Runs outside a transaction so the indexes can be built with CONCURRENTLY.
export class INVOICESv2CreateStockAdjustmentInvoiceIndexes1775287443707 implements MigrationInterface {

    public transaction = false;

    // An interrupted CONCURRENTLY build leaves an invalid index behind that no query can use and
    // that CREATE INDEX ... IF NOT EXISTS would silently keep. Drop it before rebuilding.
    private async createIndexConcurrently(queryRunner: QueryRunner, name: string, definition: string): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_class c
                    JOIN pg_index i ON i.indexrelid = c.oid
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = current_schema()
                      AND c.relname = '${name}'
                      AND NOT i.indisvalid
                ) THEN
                    EXECUTE 'DROP INDEX ${name}';
                END IF;
            END $$;
        `);

        await queryRunner.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS ${name} ${definition}`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- B-tree varchar_pattern_ops (generateInvoiceId `LIKE 'SA26-%'` + prefix ILIKE) ---
        // Not partial: generateInvoiceId deliberately looks at soft deleted invoices too, so a
        // deleted invoice never gets its number handed out again.
        await this.createIndexConcurrently(
            queryRunner,
            'idx_stock_adjustment_invoice_invoice_id_pattern',
            'ON stock_adjustment_invoice (invoice_id varchar_pattern_ops)',
        );

        // --- GIN (substring ILIKE on invoiceId, the default search mode; requires pg_trgm) ---
        await this.createIndexConcurrently(
            queryRunner,
            'idx_stock_adjustment_invoice_invoice_id_trigram',
            'ON stock_adjustment_invoice USING GIN (invoice_id gin_trgm_ops)',
        );

        // --- Partial B-tree (searchBy userId: draft_by OR confirmed_by, always on live rows) ---
        await this.createIndexConcurrently(
            queryRunner,
            'idx_stock_adjustment_invoice_not_deleted_draft_by',
            'ON stock_adjustment_invoice (draft_by) WHERE is_deleted = false',
        );

        await this.createIndexConcurrently(
            queryRunner,
            'idx_stock_adjustment_invoice_not_deleted_confirmed_by',
            'ON stock_adjustment_invoice (confirmed_by) WHERE is_deleted = false',
        );
    }

    // Plain DROP INDEX, not CONCURRENTLY: TypeORM always wraps a revert in a transaction regardless
    // of the `transaction` flag above, and CONCURRENTLY cannot run inside one. Dropping an index is
    // a metadata-only change, so the short ACCESS EXCLUSIVE lock is acceptable here.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_not_deleted_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_not_deleted_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_invoice_id_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_invoice_id_pattern`);
    }
}
