import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReturnFieldsToSellingInvoiceTablesV21772000000000 implements MigrationInterface {
    name = 'AddReturnFieldsToSellingInvoiceTablesV21772000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- SELLING_INVOICE ---
        await queryRunner.query(`
            ALTER TABLE "selling_invoice"
            ADD COLUMN "return_count" integer NOT NULL DEFAULT 0
        `);

        // --- SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`
            ALTER TABLE "selling_invoice_products"
            ADD COLUMN "return_quantity" integer NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- SELLING_INVOICE_PRODUCTS ---
        await queryRunner.query(`ALTER TABLE "selling_invoice_products" DROP COLUMN "return_quantity"`);

        // --- SELLING_INVOICE ---
        await queryRunner.query(`ALTER TABLE "selling_invoice" DROP COLUMN "return_count"`);
    }

}
