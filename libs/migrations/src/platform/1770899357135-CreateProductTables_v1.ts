import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductTablesV11770899357135 implements MigrationInterface {
    name = 'CreateProductTablesV11770899357135'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // --- PRODUCT_UNITS TABLE ---
        await queryRunner.query(`
            CREATE TABLE "product_units" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "unit_name" character varying(255) NOT NULL, 
                "unit_description" text, 
                "active" boolean NOT NULL DEFAULT true, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_product_units_id" PRIMARY KEY ("id")
            )
        `);

        // --- PRODUCTS TABLE ---
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "sku" character varying(13) NOT NULL, 
                "product_unit" uuid, 
                "product_description" text, 
                "import_price" numeric(10,2) NOT NULL, 
                "selling_price" numeric(10,2) NOT NULL, 
                "reorder_threshold" integer, 
                "inventory_stock" integer NOT NULL DEFAULT '0', 
                "active" boolean NOT NULL DEFAULT true, 
                "stock_status" integer NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "UQ_products_sku" UNIQUE ("sku"), 
                CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
            )
        `);

        // --- PRODUCT_NAMES TABLE ---
        await queryRunner.query(`
            CREATE TABLE "product_names" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "name" character varying(255) NOT NULL, 
                "product_id" uuid, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_product_names_id" PRIMARY KEY ("id")
            )
        `);

        // --- PRODUCTS_HISTORY TABLE ---
        await queryRunner.query(`
            CREATE TABLE "products_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "product_id" uuid, 
                "version" integer NOT NULL, 
                "created_by" uuid NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "data" jsonb NOT NULL, 
                CONSTRAINT "PK_products_history_id" PRIMARY KEY ("id")
            )
        `);

        // --- PRODUCT_UNITS_HISTORY TABLE ---
        await queryRunner.query(`
            CREATE TABLE "product_units_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "product_unit_id" uuid, 
                "version" integer NOT NULL, 
                "created_by" uuid NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "data" jsonb NOT NULL, 
                CONSTRAINT "PK_product_units_history_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_products_product_unit" 
            FOREIGN KEY ("product_unit") REFERENCES "product_units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "product_names" 
            ADD CONSTRAINT "FK_product_names_product_id" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "products_history" 
            ADD CONSTRAINT "FK_products_history_product_id" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "product_units_history" 
            ADD CONSTRAINT "FK_product_units_history_product_unit_id"
            FOREIGN KEY ("product_unit_id") REFERENCES "product_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_units_history" DROP CONSTRAINT "FK_product_units_history_product_unit_id"`);
        await queryRunner.query(`ALTER TABLE "products_history" DROP CONSTRAINT "FK_products_history_product_id"`);
        await queryRunner.query(`ALTER TABLE "product_names" DROP CONSTRAINT "FK_product_names_product_id"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_product_unit"`);

        await queryRunner.query(`DROP TABLE "product_units_history"`);
        await queryRunner.query(`DROP TABLE "products_history"`);
        await queryRunner.query(`DROP TABLE "product_names"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "product_units"`);
    }

}
