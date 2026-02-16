import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStockAdjustmentInvoicesAndIndexV11771240133458 implements MigrationInterface {
    name = 'CreateStockAdjustmentInvoicesAndIndexV11771240133458'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        // Install uuid-ossp extension for UUID generation.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // --- STOCK_ADJUSTMENT TABLE ---
        await queryRunner.query(`
            CREATE TABLE "stock_adjustment" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "adjustment_id" character varying(15),
                "stock_adjustment_type" character varying NOT NULL,
                "reference_id" uuid,
                "total_products" integer NOT NULL,
                "total_increase" integer NOT NULL,
                "total_decrease" integer NOT NULL,
                "notes" text,
                "status" integer NOT NULL DEFAULT 0,
                "draft_by" uuid,
                "draft_at" TIMESTAMP,
                "confirmed_by" uuid,
                "confirmed_at" TIMESTAMP,
                CONSTRAINT "PK_stock_adjustment_id" PRIMARY KEY ("id")
            )
        `);

        // --- STOCK_ADJUSTMENT_PRODUCTS TABLE ---
        await queryRunner.query(`
            CREATE TABLE "stock_adjustment_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "stock_adjustment_id" uuid,
                "product_id" uuid NOT NULL,
                "product_sku" character varying(255) NOT NULL,
                "product_name" character varying(255) NOT NULL,
                "product_unit" character varying(255) NOT NULL,
                "quantity" integer NOT NULL,
                "type" character varying NOT NULL,
                "notes" text,
                CONSTRAINT "PK_stock_adjustment_products_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "stock_adjustment_products"
            ADD CONSTRAINT "FK_stock_adjustment_products_stock_adjustment_id"
            FOREIGN KEY ("stock_adjustment_id") REFERENCES "stock_adjustment"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // --- STOCK_ADJUSTMENT INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_adjustment_id 
            ON stock_adjustment (adjustment_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_status 
            ON stock_adjustment (status)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_stock_adjustment_type 
            ON stock_adjustment (stock_adjustment_type)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_reference_id 
            ON stock_adjustment (reference_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_draft_by 
            ON stock_adjustment (draft_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_draft_at 
            ON stock_adjustment (draft_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_confirmed_by 
            ON stock_adjustment (confirmed_by)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_confirmed_at 
            ON stock_adjustment (confirmed_at)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_status_draft_at 
            ON stock_adjustment (status, draft_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_status_confirmed_at 
            ON stock_adjustment (status, confirmed_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_status_draft_by 
            ON stock_adjustment (status, draft_by)
        `);

        // --- STOCK_ADJUSTMENT_PRODUCTS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_products_stock_adjustment_id 
            ON stock_adjustment_products (stock_adjustment_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_stock_adjustment_products_product_id 
            ON stock_adjustment_products (product_id)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- STOCK_ADJUSTMENT_PRODUCTS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_products_product_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_products_stock_adjustment_id`);

        // --- STOCK_ADJUSTMENT INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_status_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_status_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_status_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_confirmed_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_confirmed_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_draft_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_draft_by`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_reference_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_stock_adjustment_type`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_stock_adjustment_adjustment_id`);

        // --- KEYS ---
        await queryRunner.query(`ALTER TABLE "stock_adjustment_products" DROP CONSTRAINT "FK_stock_adjustment_products_stock_adjustment_id"`);

        // --- STOCK_ADJUSTMENT_PRODUCTS TABLE ---
        await queryRunner.query(`DROP TABLE "stock_adjustment_products"`);

        // --- STOCK_ADJUSTMENT TABLE ---
        await queryRunner.query(`DROP TABLE "stock_adjustment"`);
    }

}
