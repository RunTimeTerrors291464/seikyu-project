import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv1CreateReturnSellingInvoiceTables1775287443157 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- RETURN_SELLING_INVOICE ---
        await queryRunner.query(`
            CREATE TABLE "return_selling_invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "return_invoice_id" character varying(15),
                "selling_invoice_id" uuid NOT NULL,
                "total_products" integer NOT NULL,
                "total_quantity" integer NOT NULL,
                "total_return_price" numeric(10,2) NOT NULL,
                "notes" text,
                "status" character varying(32) NOT NULL DEFAULT 'draft',
                "draft_by" uuid,
                "draft_at" TIMESTAMP,
                "confirmed_by" uuid,
                "confirmed_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_return_selling_invoice_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_return_selling_invoice_selling_invoice_id" FOREIGN KEY ("selling_invoice_id") REFERENCES "selling_invoice"("id") ON DELETE NO ACTION,
                CONSTRAINT "FK_return_selling_invoice_draft_by" FOREIGN KEY ("draft_by") REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_return_selling_invoice_confirmed_by" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // --- RETURN_SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "return_selling_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "return_selling_invoice_id" uuid NOT NULL,
                "selling_invoice_product_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "product_sku" character varying(255) NOT NULL,
                "product_name" character varying(255) NOT NULL,
                "product_unit" character varying(255) NOT NULL,
                "return_quantity" integer NOT NULL,
                "selling_price" numeric(10,2) NOT NULL,
                "total_return_price" numeric(10,2) NOT NULL,
                "reason_category" character varying(64) NOT NULL DEFAULT 'other',
                "reason_notes" text,
                CONSTRAINT "PK_return_selling_invoice_products_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_return_selling_invoice_products_return_selling_invoice_id" FOREIGN KEY ("return_selling_invoice_id") REFERENCES "return_selling_invoice"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_return_selling_invoice_products_selling_invoice_product_id" FOREIGN KEY ("selling_invoice_product_id") REFERENCES "selling_invoice_products"("id") ON DELETE NO ACTION,
                CONSTRAINT "FK_return_selling_invoice_products_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "return_selling_invoice_products"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "return_selling_invoice"`);
    }
}
