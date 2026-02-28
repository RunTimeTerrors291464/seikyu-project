import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAndAddIndexStockAdjustmentInvoiceTablesV11772300000000 implements MigrationInterface {
    name = 'CreateAndAddIndexStockAdjustmentInvoiceTablesV11772300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // --- STOCK_ADJUSTMENT_INVOICE ---
        await queryRunner.query(`
            CREATE TABLE "stock_adjustment_invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "invoice_id" character varying(15),
                "total_products" integer NOT NULL,
                "total_quantity" integer NOT NULL,
                "action_reason" character varying NOT NULL,
                "notes" text,
                "status" character varying NOT NULL DEFAULT 'draft',
                "draft_by" uuid,
                "draft_at" TIMESTAMP,
                "confirmed_by" uuid,
                "confirmed_at" TIMESTAMP,
                CONSTRAINT "PK_stock_adjustment_invoice_id" PRIMARY KEY ("id")
            )
        `);

        // --- STOCK_ADJUSTMENT_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "stock_adjustment_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "stock_adjustment_invoice_id" uuid,
                "product_id" uuid NOT NULL,
                "product_sku" character varying(255) NOT NULL,
                "product_name" character varying(255) NOT NULL,
                "product_unit" character varying(255) NOT NULL,
                "action" character varying NOT NULL,
                "quantity" integer NOT NULL,
                "notes" text,
                CONSTRAINT "PK_stock_adjustment_invoice_products_id" PRIMARY KEY ("id")
            )
        `);

        // --- FOREIGN KEYS ---
        await queryRunner.query(`
            ALTER TABLE "stock_adjustment_invoice_products"
            ADD CONSTRAINT "FK_stock_adjustment_invoice_products_invoice_id"
            FOREIGN KEY ("stock_adjustment_invoice_id") REFERENCES "stock_adjustment_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // --- STOCK_ADJUSTMENT_INVOICE INDEXES ---
        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_invoice_id
            ON stock_adjustment_invoice (invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_status
            ON stock_adjustment_invoice (status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_action_reason
            ON stock_adjustment_invoice (action_reason)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_draft_by
            ON stock_adjustment_invoice (draft_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_confirmed_by
            ON stock_adjustment_invoice (confirmed_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_draft_at
            ON stock_adjustment_invoice (draft_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_confirmed_at
            ON stock_adjustment_invoice (confirmed_at)
        `);

        // --- B-tree text-pattern-ops ---
        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_invoice_id_pattern
            ON stock_adjustment_invoice (invoice_id varchar_pattern_ops)
        `);

        // --- STOCK_ADJUSTMENT_INVOICE_PRODUCTS INDEXES ---
        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_products_invoice_id
            ON stock_adjustment_invoice_products (stock_adjustment_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_invoice_products_product_id
            ON stock_adjustment_invoice_products (product_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // Drop indexes - products.
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_products_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_products_invoice_id`);

        // Drop indexes - invoice.
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_invoice_id_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_action_reason`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_invoice_invoice_id`);

        // Drop FK and tables.
        await queryRunner.query(`ALTER TABLE "stock_adjustment_invoice_products" DROP CONSTRAINT IF EXISTS "FK_stock_adjustment_invoice_products_invoice_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stock_adjustment_invoice_products"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stock_adjustment_invoice"`);
    }
}
