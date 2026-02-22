import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductHistoryTablesV11771767240008 implements MigrationInterface {
    name = 'CreateProductHistoryTablesV11771767240008'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // --- PRODUCT_UNITS_HISTORY ---
        await queryRunner.query(`
            CREATE TABLE "product_units_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "product_unit_id" uuid NOT NULL, 
                "version" integer NOT NULL, 
                "created_by" uuid NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "data" jsonb NOT NULL, 
                CONSTRAINT "PK_product_units_history_id" PRIMARY KEY ("id")
            )
        `);

        // --- PRODUCTS_HISTORY ---
        await queryRunner.query(`
            CREATE TABLE "products_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "product_id" uuid NOT NULL, 
                "version" integer NOT NULL, 
                "created_by" uuid NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "data" jsonb NOT NULL, 
                CONSTRAINT "PK_products_history_id" PRIMARY KEY ("id")
            )
        `);

        // --- PRODUCT_STOCK_HISTORY ---
        await queryRunner.query(`
            CREATE TABLE "product_stock_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "product_id" uuid NOT NULL, 
                "quantity_type" character varying(255) NOT NULL, 
                "quantity" integer NOT NULL, 
                "reference_type" character varying(255) NOT NULL, 
                "reference_id" uuid NOT NULL, 
                "before_inventory_stock" integer NOT NULL, 
                "after_inventory_stock" integer NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_product_stock_history_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "product_units_history" 
            ADD CONSTRAINT "FK_product_units_history_product_unit_id" 
            FOREIGN KEY ("product_unit_id") REFERENCES "product_units"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "products_history" 
            ADD CONSTRAINT "FK_products_history_product_id" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "product_stock_history" 
            ADD CONSTRAINT "FK_product_stock_history_product_id" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_stock_history" DROP CONSTRAINT "FK_product_stock_history_product_id"`);
        await queryRunner.query(`ALTER TABLE "products_history" DROP CONSTRAINT "FK_products_history_product_id"`);
        await queryRunner.query(`ALTER TABLE "product_units_history" DROP CONSTRAINT "FK_product_units_history_product_unit_id"`);

        await queryRunner.query(`DROP TABLE "product_stock_history"`);
        await queryRunner.query(`DROP TABLE "products_history"`);
        await queryRunner.query(`DROP TABLE "product_units_history"`);

    }

}
