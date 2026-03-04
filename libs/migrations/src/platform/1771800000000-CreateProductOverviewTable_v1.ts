import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductOverviewTableV11771800000000 implements MigrationInterface {
    name = 'CreateProductOverviewTableV11771800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT_OVERVIEW ---
        // Single record table to maintain aggregate stats of all products
        await queryRunner.query(`
            CREATE TABLE "product_overview" (
                "id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001', 
                "total_products" integer NOT NULL DEFAULT 0, 
                "in_stock" integer NOT NULL DEFAULT 0, 
                "low_stock" integer NOT NULL DEFAULT 0, 
                "out_of_stock" integer NOT NULL DEFAULT 0, 
                "inventory_value" numeric(15,2) NOT NULL DEFAULT 0, 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_product_overview_id" PRIMARY KEY ("id")
            )
        `);

        // Insert the single overview record
        await queryRunner.query(`
            INSERT INTO "product_overview" (id, total_products, in_stock, low_stock, out_of_stock, inventory_value)
            VALUES ('00000000-0000-0000-0000-000000000001', 0, 0, 0, 0, 0)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product_overview"`);
    }

}
