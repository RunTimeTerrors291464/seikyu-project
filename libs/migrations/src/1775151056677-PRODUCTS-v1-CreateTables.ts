import { MigrationInterface, QueryRunner } from 'typeorm';

export class PRODUCTSv1CreateTables1775151056677 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- ENUM types for product_stock_history (TypeORM string enums) ---
        await queryRunner.query(`
            CREATE TYPE "product_stock_history_quantity_type_enum" AS ENUM ('add', 'subtract')
        `);

        await queryRunner.query(`
            CREATE TYPE "product_stock_history_reference_type_enum" AS ENUM (
                'import',
                'returnImport',
                'selling',
                'returnSelling',
                'stockAdjustment'
            )
        `);

        // --- PRODUCTS ---
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sku" character varying(13) NOT NULL,
                "product_unit_id" uuid NOT NULL,
                "product_description" text,
                "import_price" numeric(10,2) NOT NULL,
                "selling_price" numeric(10,2) NOT NULL,
                "reorder_threshold" integer,
                "inventory_stock" integer NOT NULL DEFAULT 0,
                "is_active" boolean NOT NULL DEFAULT true,
                "stock_status" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_products_sku" UNIQUE ("sku"),
                CONSTRAINT "FK_products_product_unit_id" FOREIGN KEY ("product_unit_id") REFERENCES "product_units"("id")
            )
        `);

        // --- PRODUCT NAMES ---
        await queryRunner.query(`
            CREATE TABLE "product_names" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "is_main" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_names_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_product_names_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);

        // --- PRODUCTS HISTORY ---
        await queryRunner.query(`
            CREATE TABLE "products_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "version" integer NOT NULL,
                "created_by" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "events" jsonb NOT NULL,
                "events_summary" character varying[] NOT NULL,
                "is_snapshot" boolean NOT NULL DEFAULT false,
                "data" jsonb,
                CONSTRAINT "PK_products_history_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_products_history_product_version" UNIQUE ("product_id", "version"),
                CONSTRAINT "FK_products_history_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_products_history_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // --- PRODUCT STOCK HISTORY ---
        await queryRunner.query(`
            CREATE TABLE "product_stock_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "quantity_type" "product_stock_history_quantity_type_enum" NOT NULL,
                "quantity" integer NOT NULL,
                "reference_type" "product_stock_history_reference_type_enum" NOT NULL,
                "reference_id" uuid NOT NULL,
                "before_inventory_stock" integer NOT NULL,
                "after_inventory_stock" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_stock_history_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_product_stock_history_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);

        // --- PRODUCT OVERVIEW (singleton aggregate row) ---
        await queryRunner.query(`
            CREATE TABLE "product_overview" (
                "id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
                "total_products" integer NOT NULL DEFAULT 0,
                "in_stock" integer NOT NULL DEFAULT 0,
                "low_stock" integer NOT NULL DEFAULT 0,
                "out_of_stock" integer NOT NULL DEFAULT 0,
                "inventory_value" numeric(15,2) NOT NULL DEFAULT 0,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_overview_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`DROP TABLE IF EXISTS "product_overview"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "product_stock_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "products_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "product_names"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "products"`);

        await queryRunner.query(`DROP TYPE IF EXISTS "product_stock_history_reference_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "product_stock_history_quantity_type_enum"`);
    }
}
