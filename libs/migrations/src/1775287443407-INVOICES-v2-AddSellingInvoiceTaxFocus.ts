import { MigrationInterface, QueryRunner } from 'typeorm';

export class INVOICESv2AddSellingInvoiceTaxFocus1775287443407 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "selling_invoice"
            ADD COLUMN "tax_focus" boolean NOT NULL DEFAULT false
        `);

        // Optional: keep DEFAULT in DB for safety; application still sends explicit values from DTO.

        await queryRunner.query(`
            CREATE INDEX "idx_selling_invoice_tax_focus_created_at"
            ON "selling_invoice" ("tax_focus", "created_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_selling_invoice_tax_focus_created_at"`);
        await queryRunner.query(`ALTER TABLE "selling_invoice" DROP COLUMN IF EXISTS "tax_focus"`);
    }
}
