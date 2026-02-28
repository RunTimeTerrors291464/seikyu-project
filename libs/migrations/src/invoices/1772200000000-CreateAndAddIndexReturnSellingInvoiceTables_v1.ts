import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAndAddIndexReturnSellingInvoiceTablesV11772200000000 implements MigrationInterface {
    name = 'CreateAndAddIndexReturnSellingInvoiceTablesV11772200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // --- RETURN_SELLING_INVOICE ---
        await queryRunner.query(`
            CREATE TABLE "return_selling_invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "return_invoice_id" character varying(15),
                "selling_invoice_id" uuid,
                "total_products" integer NOT NULL, 
                "total_quantity" integer NOT NULL, 
                "total_return_price" numeric(10,2) NOT NULL, 
                "notes" text, 
                "status" character varying(255) NOT NULL DEFAULT 'draft', 
                "draft_by" uuid, 
                "draft_at" TIMESTAMP, 
                "confirmed_by" uuid, 
                "confirmed_at" TIMESTAMP, 
                CONSTRAINT "PK_return_selling_invoice_id" PRIMARY KEY ("id")
            )
        `);

        // --- RETURN_SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "return_selling_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "return_selling_invoice_id" uuid,
                "selling_invoice_product_id" uuid,
                "product_id" uuid NOT NULL, 
                "product_sku" character varying(255) NOT NULL, 
                "product_name" character varying(255) NOT NULL, 
                "product_unit" character varying(255) NOT NULL, 
                "return_quantity" integer NOT NULL, 
                "selling_price" numeric(10,2) NOT NULL, 
                "total_return_price" numeric(10,2) NOT NULL, 
                "notes" text, 
                CONSTRAINT "PK_return_selling_invoice_products_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "return_selling_invoice" 
            ADD CONSTRAINT "FK_return_selling_invoice_selling_invoice_id" 
            FOREIGN KEY ("selling_invoice_id") REFERENCES "selling_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "return_selling_invoice_products" 
            ADD CONSTRAINT "FK_return_selling_invoice_products_return_selling_invoice_id" 
            FOREIGN KEY ("return_selling_invoice_id") REFERENCES "return_selling_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "return_selling_invoice_products" 
            ADD CONSTRAINT "FK_return_selling_invoice_products_selling_invoice_product_id" 
            FOREIGN KEY ("selling_invoice_product_id") REFERENCES "selling_invoice_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // --- RETURN_SELLING_INVOICE INDEXES ---
        // --- Single column B-tree index ---
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
            CREATE INDEX idx_return_selling_invoice_total_return_price 
            ON return_selling_invoice (total_return_price)
        `);

        // --- B-tree text-pattern-ops ---
        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_return_invoice_id_pattern 
            ON return_selling_invoice (return_invoice_id varchar_pattern_ops)
        `);

        // --- GIN index ---
        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_return_invoice_id_trigram 
            ON return_selling_invoice USING GIN (return_invoice_id gin_trgm_ops)
        `);

        // --- RETURN_SELLING_INVOICE_PRODUCTS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_products_return_selling_invoice_id 
            ON return_selling_invoice_products (return_selling_invoice_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_products_selling_invoice_product_id 
            ON return_selling_invoice_products (selling_invoice_product_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_return_selling_invoice_products_product_id 
            ON return_selling_invoice_products (product_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- RETURN_SELLING_INVOICE_PRODUCTS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_products_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_products_selling_invoice_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_products_return_selling_invoice_id`);

        // --- RETURN_SELLING_INVOICE INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_return_invoice_id_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_return_invoice_id_pattern`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_total_return_price`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_selling_invoice_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_return_selling_invoice_return_invoice_id`);

        // --- KEYS ---
        await queryRunner.query(`ALTER TABLE "return_selling_invoice_products" DROP CONSTRAINT "FK_return_selling_invoice_products_selling_invoice_product_id"`);
        await queryRunner.query(`ALTER TABLE "return_selling_invoice_products" DROP CONSTRAINT "FK_return_selling_invoice_products_return_selling_invoice_id"`);
        await queryRunner.query(`ALTER TABLE "return_selling_invoice" DROP CONSTRAINT "FK_return_selling_invoice_selling_invoice_id"`);

        // --- TABLES ---
        await queryRunner.query(`DROP TABLE "return_selling_invoice_products"`);
        await queryRunner.query(`DROP TABLE "return_selling_invoice"`);
    }

}
