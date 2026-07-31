import { MigrationInterface, QueryRunner } from 'typeorm';

// Soft delete flag for the three main invoices. Confirmed invoices are hidden instead of removed;
// there is no restore endpoint, so every read path filters on is_deleted = false.
// Return invoices have no flag of their own: they are hidden through their parent invoice.
//
// Runs outside a transaction so the indexes can be built with CONCURRENTLY, which keeps reads and
// writes on the invoice tables running while the index is built. Every statement is therefore
// idempotent: a failed run can simply be executed again.
export class INVOICESv2AddInvoiceIsDeleted1775287443607 implements MigrationInterface {

    public transaction = false;

    private static readonly _tables = ['selling_invoice', 'import_invoice', 'stock_adjustment_invoice'];

    // Tables whose return invoices are hidden by joining back to the parent invoice.
    private static readonly _parentOfReturnTables = ['selling_invoice', 'import_invoice'];

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

        // --- Column ---
        // PostgreSQL 11+ stores the default in the catalog, so this is a metadata-only change:
        // no table rewrite, only a short ACCESS EXCLUSIVE lock.
        for (const table of INVOICESv2AddInvoiceIsDeleted1775287443607._tables) {
            await queryRunner.query(`
                ALTER TABLE "${table}"
                ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false
            `);
        }

        // --- Partial B-tree indexes for the list endpoints ---
        // Every list query filters is_deleted = false plus the mandatory created_at range, and sorts
        // by created_at (default) or by status + created_at. A partial index drops the predicate and
        // indexes only the live rows, so it stays smaller than the existing full indexes.
        // The other sort columns (totals, return_count, draft_at, confirmed_at) keep using their
        // existing full indexes; is_deleted is then rechecked on the heap tuple, which is free.
        for (const table of INVOICESv2AddInvoiceIsDeleted1775287443607._tables) {
            await this.createIndexConcurrently(
                queryRunner,
                `idx_${table}_not_deleted_created_at`,
                `ON ${table} (created_at DESC) WHERE is_deleted = false`,
            );

            await this.createIndexConcurrently(
                queryRunner,
                `idx_${table}_not_deleted_status_created_at`,
                `ON ${table} (status, created_at DESC) WHERE is_deleted = false`,
            );
        }

        // --- Partial B-tree index for the return invoice lists ---
        // Return invoice lists now join back to the parent invoice on every request to check
        // is_deleted. This index lets that join and its COUNT run as an index-only scan over the
        // live parent ids instead of touching the parent heap.
        for (const table of INVOICESv2AddInvoiceIsDeleted1775287443607._parentOfReturnTables) {
            await this.createIndexConcurrently(
                queryRunner,
                `idx_${table}_not_deleted_id`,
                `ON ${table} (id) WHERE is_deleted = false`,
            );
        }

        // --- Statistics ---
        // Without fresh stats the planner has no idea how selective is_deleted is and can pick the
        // new partial indexes over a better one. Sampled, so this is cheap.
        for (const table of INVOICESv2AddInvoiceIsDeleted1775287443607._tables) {
            await queryRunner.query(`ANALYZE ${table}`);
        }
    }

    // Plain DROP INDEX, not CONCURRENTLY: TypeORM always wraps a revert in a transaction regardless
    // of the `transaction` flag above, and CONCURRENTLY cannot run inside one. Dropping an index is
    // a metadata-only change, so the short ACCESS EXCLUSIVE lock is acceptable here.
    public async down(queryRunner: QueryRunner): Promise<void> {

        for (const table of [...INVOICESv2AddInvoiceIsDeleted1775287443607._parentOfReturnTables].reverse()) {
            await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_not_deleted_id`);
        }

        for (const table of [...INVOICESv2AddInvoiceIsDeleted1775287443607._tables].reverse()) {
            await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_not_deleted_status_created_at`);
            await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_not_deleted_created_at`);
            await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "is_deleted"`);
        }
    }
}
