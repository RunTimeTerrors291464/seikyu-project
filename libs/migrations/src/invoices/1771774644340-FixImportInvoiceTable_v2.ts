import { MigrationInterface, QueryRunner } from "typeorm";

export class FixImportInvoiceTableV21771774644340 implements MigrationInterface {
    name = 'FixImportInvoiceTableV21771774644340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_import_invoice_status"`);

        await queryRunner.query(`ALTER TABLE "import_invoice" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`
            ALTER TABLE "import_invoice" ALTER COLUMN "status" TYPE varchar USING (
                CASE "status"
                    WHEN 0 THEN 'draft'
                    WHEN 1 THEN 'confirmed'
                    WHEN 2 THEN 'partially_returned'
                    WHEN 3 THEN 'returned'
                    ELSE 'draft'
                END
            )
        `);
        await queryRunner.query(`ALTER TABLE "import_invoice" ALTER COLUMN "status" SET DEFAULT 'draft'`);

        await queryRunner.query(`CREATE INDEX "idx_import_invoice_status" ON "import_invoice" ("status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_import_invoice_status"`);

        await queryRunner.query(`ALTER TABLE "import_invoice" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`
            ALTER TABLE "import_invoice" ALTER COLUMN "status" TYPE integer USING (
                CASE "status"
                    WHEN 'draft' THEN 0
                    WHEN 'confirmed' THEN 1
                    WHEN 'partially_returned' THEN 2
                    WHEN 'returned' THEN 3
                    ELSE 0
                END
            )
        `);
        await queryRunner.query(`ALTER TABLE "import_invoice" ALTER COLUMN "status" SET DEFAULT 0`);

        await queryRunner.query(`CREATE INDEX "idx_import_invoice_status" ON "import_invoice" ("status")`);
    }

}

