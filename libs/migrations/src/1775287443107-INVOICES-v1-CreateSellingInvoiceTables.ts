import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv1CreateSellingInvoiceTables1775287443107 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- SELLING_INVOICE ---
        await queryRunner.query(`
            CREATE TABLE "selling_invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "invoice_id" character varying(15),
                "total_products" integer NOT NULL,
                "total_quantity" integer NOT NULL,
                "invoice_discount" numeric(10,2) NOT NULL DEFAULT 0,
                "total_selling_price" numeric(10,2) NOT NULL,
                "notes" text,
                "status" character varying(32) NOT NULL DEFAULT 'confirmed',
                "return_count" integer NOT NULL DEFAULT 0,
                "confirmed_by" uuid,
                "confirmed_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_selling_invoice_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_selling_invoice_confirmed_by" FOREIGN KEY ("confirmed_by") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // --- SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "selling_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "selling_invoice_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "product_sku" character varying(255) NOT NULL,
                "product_name" character varying(255) NOT NULL,
                "product_unit" character varying(255) NOT NULL,
                "quantity" integer NOT NULL,
                "return_quantity" integer NOT NULL DEFAULT 0,
                "selling_price" numeric(10,2) NOT NULL,
                "product_discount" numeric(10,2) NOT NULL DEFAULT 0,
                "total_selling_price" numeric(10,2) NOT NULL,
                "notes" text,
                CONSTRAINT "PK_selling_invoice_products_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_selling_invoice_products_selling_invoice_id" FOREIGN KEY ("selling_invoice_id") REFERENCES "selling_invoice"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_selling_invoice_products_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "selling_invoice_products"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "selling_invoice"`);
    }
}
