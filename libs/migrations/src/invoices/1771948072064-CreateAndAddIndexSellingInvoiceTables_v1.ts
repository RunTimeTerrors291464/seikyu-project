import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAndAddIndexSellingInvoiceTablesV11771948072064 implements MigrationInterface {
    name = 'CreateAndAddIndexSellingInvoiceTablesV11771948072064'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

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
                "status" character varying(255) NOT NULL DEFAULT 'CONFIRMED',
                "confirmed_by" uuid,
                "confirmed_at" TIMESTAMP,
                CONSTRAINT "PK_selling_invoice_id" PRIMARY KEY ("id")
            )
        `);

        // --- SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "selling_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "selling_invoice_id" uuid,
                "product_id" uuid NOT NULL,
                "product_sku" character varying(255) NOT NULL,
                "product_name" character varying(255) NOT NULL,
                "product_unit" character varying(255) NOT NULL,
                "quantity" integer NOT NULL,
                "selling_price" numeric(10,2) NOT NULL,
                "product_discount" numeric(10,2) NOT NULL DEFAULT 0,
                "total_selling_price" numeric(10,2) NOT NULL,
                "notes" text,
                CONSTRAINT "PK_selling_invoice_products_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "selling_invoice_products"
            ADD CONSTRAINT "FK_selling_invoice_products_selling_invoice_id"
            FOREIGN KEY ("selling_invoice_id") REFERENCES "selling_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        
        // --- KEYS ---
        await queryRunner.query(`ALTER TABLE "selling_invoice_products" DROP CONSTRAINT "FK_selling_invoice_products_selling_invoice_id"`);

        // --- TABLES ---
        await queryRunner.query(`DROP TABLE "selling_invoice_products"`);
        await queryRunner.query(`DROP TABLE "selling_invoice"`);
    }

}
