import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterProductUnitsHistoryTableV31772900000001 implements MigrationInterface {
    name = 'AlterProductUnitsHistoryTableV31772900000001'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- ADD NEW COLUMNS ---
        // events: stores the change events for this version
        await queryRunner.query(`
            ALTER TABLE "product_units_history" 
            ADD COLUMN "events" jsonb NOT NULL DEFAULT '[]'::jsonb
        `);

        // events_summary: quick-access list of changed field names
        await queryRunner.query(`
            ALTER TABLE "product_units_history" 
            ADD COLUMN "events_summary" character varying[] NOT NULL DEFAULT '{}'::character varying[]
        `);

        // is_snapshot: whether this version stores a full snapshot
        await queryRunner.query(`
            ALTER TABLE "product_units_history" 
            ADD COLUMN "is_snapshot" boolean NOT NULL DEFAULT false
        `);

        // --- MIGRATE EXISTING DATA ---
        // Existing rows were created before Event Sourcing — treat them as full snapshots with a new_product_unit event
        await queryRunner.query(`
            UPDATE "product_units_history"
            SET
                "is_snapshot"     = true,
                "events_summary"  = ARRAY['new_product_unit']::character varying[],
                "events"          = '[{"fieldName": "new_product_unit", "previousValue": null, "newValue": null}]'::jsonb
            WHERE "data" IS NOT NULL
        `);

        // --- ALTER data COLUMN: change from NOT NULL to NULLABLE ---
        await queryRunner.query(`
            ALTER TABLE "product_units_history" 
            ALTER COLUMN "data" DROP NOT NULL
        `);

        // --- REMOVE COLUMN DEFAULTS (no longer needed after migration) ---
        await queryRunner.query(`ALTER TABLE "product_units_history" ALTER COLUMN "events" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "product_units_history" ALTER COLUMN "events_summary" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "product_units_history" ALTER COLUMN "is_snapshot" DROP DEFAULT`);

        // --- ADD INDEX for fast revert lookup (find nearest snapshot) ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_history_product_unit_id_is_snapshot 
            ON "product_units_history" (product_unit_id, is_snapshot)
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- REMOVE INDEX ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_history_product_unit_id_is_snapshot`);

        // --- RESTORE data COLUMN to NOT NULL ---
        // Fill any null data rows with empty object before making NOT NULL
        await queryRunner.query(`UPDATE "product_units_history" SET "data" = '{}'::jsonb WHERE "data" IS NULL`);
        await queryRunner.query(`ALTER TABLE "product_units_history" ALTER COLUMN "data" SET NOT NULL`);

        // --- DROP ADDED COLUMNS ---
        await queryRunner.query(`ALTER TABLE "product_units_history" DROP COLUMN "is_snapshot"`);
        await queryRunner.query(`ALTER TABLE "product_units_history" DROP COLUMN "events_summary"`);
        await queryRunner.query(`ALTER TABLE "product_units_history" DROP COLUMN "events"`);

    }

}
