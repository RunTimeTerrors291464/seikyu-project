import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv1CreateStockAdjustmentInvoiceTables1775287443167 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- STOCK_ADJUSTMENT_INVOICE ---
        await queryRunner.query(`
            CREATE TABLE "stock_adjustment_invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "invoice_id" character varying(15),
                "total_products" integer NOT NULL,
                "total_quantity" integer NOT NULL,
                "notes" text,
                "status" character varying(32) NOT NULL DEFAULT 'draft',
                "draft_by" uuid,
                "draft_at" TIMESTAMP,
                "confirmed_by" uuid,
                "confirmed_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_stock_adjustment_invoice_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_stock_adjustment_invoice_draft_by" FOREIGN KEY ("draft_by") REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_stock_adjustment_invoice_confirmed_by" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // --- STOCK_ADJUSTMENT_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "stock_adjustment_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "stock_adjustment_invoice_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "product_sku" character varying(255) NOT NULL,
                "product_name" character varying(255) NOT NULL,
                "product_unit" character varying(255) NOT NULL,
                "action" character varying(32) NOT NULL,
                "quantity" integer NOT NULL,
                "reason_category" character varying(64) NOT NULL DEFAULT 'other',
                "reason_notes" text,
                "notes" text,
                CONSTRAINT "PK_stock_adjustment_invoice_products_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_stock_adjustment_invoice_products_stock_adjustment_invoice_id" FOREIGN KEY ("stock_adjustment_invoice_id") REFERENCES "stock_adjustment_invoice"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_stock_adjustment_invoice_products_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "stock_adjustment_invoice_products"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stock_adjustment_invoice"`);
    }
}
