import { MigrationInterface, QueryRunner } from 'typeorm';

export class PRODUCTUNITSv1CreateTables1774974015184 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT UNITS ---
        await queryRunner.query(`
            CREATE TABLE "product_units" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "unit_name" character varying(255) NOT NULL,
                "unit_description" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_units_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_units_unit_name" UNIQUE ("unit_name")
            )
        `);

        // --- PRODUCT UNITS HISTORY ---
        await queryRunner.query(`
            CREATE TABLE "product_units_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_unit_id" uuid NOT NULL,
                "version" integer NOT NULL,
                "created_by" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "events" jsonb NOT NULL,
                "events_summary" character varying[] NOT NULL,
                "is_snapshot" boolean NOT NULL DEFAULT false,
                "data" jsonb,
                CONSTRAINT "PK_product_units_history_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_units_history_unit_version" UNIQUE ("product_unit_id", "version"),
                CONSTRAINT "FK_product_units_history_product_unit_id" FOREIGN KEY ("product_unit_id") REFERENCES "product_units"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_product_units_history_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // =============================================
        // INDEXES — product_units
        // =============================================

        // --- Single column B-tree ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_is_active
            ON product_units (is_active)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_created_at
            ON product_units (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_updated_at
            ON product_units (updated_at)
        `);

        // --- Multi column B-tree (covers filter + sort queries) ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_is_active_created_at
            ON product_units (is_active, created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_is_active_updated_at
            ON product_units (is_active, updated_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_product_units_is_active_unit_name
            ON product_units (is_active, unit_name)
        `);

        // --- GIN trigram index (covers ILIKE search on unit_name) ---
        await queryRunner.query(`
            CREATE INDEX idx_product_units_unit_name_trigram
            ON product_units USING GIN (unit_name gin_trgm_ops)
        `);

        // =============================================
        // INDEXES — product_units_history
        // =============================================

        // UQ_product_units_history_unit_version already covers:
        //   WHERE product_unit_id = ? ORDER BY version
        //   WHERE product_unit_id = ? AND version = ?

        // B-tree on created_by (FK lookups, audit queries)
        await queryRunner.query(`
            CREATE INDEX idx_product_units_history_created_by
            ON product_units_history (created_by)
        `);

        // B-tree on created_at (chronological ordering)
        await queryRunner.query(`
            CREATE INDEX idx_product_units_history_created_at
            ON product_units_history (created_at)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // --- INDEXES — product_units_history ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_history_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_history_created_by`);

        // --- INDEXES — product_units ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_unit_name_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_is_active_unit_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_is_active_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_is_active_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_units_is_active`);

        // --- TABLES (history first due to FK) ---
        await queryRunner.query(`DROP TABLE IF EXISTS "product_units_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "product_units"`);
    }
}
