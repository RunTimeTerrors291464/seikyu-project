import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAndAddIndexReturnImportInvoiceTablesV11771780369697 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // --- RETURN_IMPORT_INVOICE ---
        await queryRunner.query(`
            CREATE TABLE "return_import_invoice" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "return_invoice_id" character varying(15),
                "import_invoice_id" uuid,
                "total_products" integer NOT NULL, 
                "total_quantity" integer NOT NULL, 
                "total_return_price" numeric(10,2) NOT NULL, 
                "notes" text, 
                "status" character varying(255) NOT NULL DEFAULT 'DRAFT', 
                "draft_by" uuid, 
                "draft_at" TIMESTAMP, 
                "confirmed_by" uuid, 
                "confirmed_at" TIMESTAMP, 
                CONSTRAINT "PK_return_import_invoice_id" PRIMARY KEY ("id")
            )
        `);

        // --- RETURN_IMPORT_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "return_import_invoice_products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "return_import_invoice_id" uuid,
                "import_invoice_product_id" uuid,
                "product_id" uuid NOT NULL, 
                "product_sku" character varying(255) NOT NULL, 
                "product_name" character varying(255) NOT NULL, 
                "product_unit" character varying(255) NOT NULL, 
                "return_quantity" integer NOT NULL, 
                "import_price" numeric(10,2) NOT NULL, 
                "total_return_price" numeric(10,2) NOT NULL, 
                "notes" text, 
                CONSTRAINT "PK_return_import_invoice_products_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "return_import_invoice" 
            ADD CONSTRAINT "FK_return_import_invoice_import_invoice_id" 
            FOREIGN KEY ("import_invoice_id") REFERENCES "import_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "return_import_invoice_products" 
            ADD CONSTRAINT "FK_return_import_invoice_products_return_import_invoice_id" 
            FOREIGN KEY ("return_import_invoice_id") REFERENCES "return_import_invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "return_import_invoice_products" 
            ADD CONSTRAINT "FK_return_import_invoice_products_import_invoice_product_id" 
            FOREIGN KEY ("import_invoice_product_id") REFERENCES "import_invoice_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- KEYS ---
        await queryRunner.query(`ALTER TABLE "return_import_invoice_products" DROP CONSTRAINT "FK_return_import_invoice_products_import_invoice_product_id"`);
        await queryRunner.query(`ALTER TABLE "return_import_invoice_products" DROP CONSTRAINT "FK_return_import_invoice_products_return_import_invoice_id"`);
        await queryRunner.query(`ALTER TABLE "return_import_invoice" DROP CONSTRAINT "FK_return_import_invoice_import_invoice_id"`);

        // --- TABLES ---
        await queryRunner.query(`DROP TABLE "return_import_invoice_products"`);
        await queryRunner.query(`DROP TABLE "return_import_invoice"`);
    }

}
