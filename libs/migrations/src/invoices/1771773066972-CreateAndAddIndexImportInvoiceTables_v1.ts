import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAndAddIndexImportInvoiceTablesV11771773066972 implements MigrationInterface {
    name = 'CreateAndAddIndexImportInvoiceTablesV11771773066972'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // --- IMPORT_INVOICE ---
        await queryRunner.query(`
            CREATE TABLE "import_invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "invoice_id" character varying(15), 
                "total_products" integer NOT NULL, 
                "total_quantity" integer NOT NULL, 
                "total_import_price" numeric(10,2) NOT NULL, 
                "notes" text, 
                "status" integer NOT NULL DEFAULT 0, 
                "return_count" integer NOT NULL DEFAULT 0, 
                "draft_by" uuid, 
                "draft_at" TIMESTAMP, 
                "confirmed_by" uuid, 
                "confirmed_at" TIMESTAMP, 
                CONSTRAINT "PK_import_invoice_id" PRIMARY KEY ("id")
            )
        `);

        // --- IMPORT_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "import_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "import_invoice_id" uuid, 
                "product_id" uuid NOT NULL, 
                "product_sku" character varying(255) NOT NULL, 
                "product_name" character varying(255) NOT NULL, 
                "product_unit" character varying(255) NOT NULL, 
                "quantity" integer NOT NULL, 
                "returned_quantity" integer NOT NULL DEFAULT 0, 
                "import_price" numeric(10,2) NOT NULL, 
                "total_import_price" numeric(10,2) NOT NULL, 
                "notes" text, 
                CONSTRAINT "PK_import_invoice_products_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "import_invoice_products" 
            ADD CONSTRAINT "FK_import_invoice_products_import_invoice_id" 
            FOREIGN KEY ("import_invoice_id") REFERENCES "import_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // --- IMPORT_INVOICE INDEXES ---
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
            CREATE INDEX idx_import_invoice_total_import_price 
            ON import_invoice (total_import_price)
        `);

        // --- B-tree text-pattern-ops ---
        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_invoice_id_pattern 
            ON import_invoice (invoice_id varchar_pattern_ops)
        `);

        // --- GIN index ---
        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_invoice_id_trigram 
            ON import_invoice USING GIN (invoice_id gin_trgm_ops)
        `);

        // --- IMPORT_INVOICE_PRODUCTS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_products_import_invoice_id 
            ON import_invoice_products (import_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_import_invoice_products_product_id 
            ON import_invoice_products (product_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- IMPORT_INVOICE_PRODUCTS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_products_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_products_import_invoice_id`);

        // --- IMPORT_INVOICE INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_invoice_id_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_invoice_id_pattern`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_total_import_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_import_invoice_invoice_id`);

        // --- KEYS ---
        await queryRunner.query(`ALTER TABLE "import_invoice_products" DROP CONSTRAINT "FK_import_invoice_products_import_invoice_id"`);

        // --- TABLES ---
        await queryRunner.query(`DROP TABLE "import_invoice_products"`);
        await queryRunner.query(`DROP TABLE "import_invoice"`);
    }

}
