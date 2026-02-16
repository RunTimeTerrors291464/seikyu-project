import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProductTablesAndIndexProductStockV21771221626649 implements MigrationInterface {
    name = 'UpdateProductTablesAndIndexProductStockV21771221626649'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT_STOCK_HISTORY TABLE ---
        await queryRunner.query(`
            CREATE TABLE "product_stock_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid,
                "quantity_type" character varying NOT NULL,
                "quantity" integer NOT NULL,
                "reference_type" character varying NOT NULL,
                "reference_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_stock_history_id" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "product_stock_history"
            ADD CONSTRAINT "FK_product_stock_history_product_id"
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        // --- PRODUCT_STOCK_HISTORY INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_stock_history_product_id 
            ON product_stock_history (product_id)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_product_stock_history_product_id_created_at 
            ON product_stock_history (product_id, created_at DESC)
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- PRODUCT_STOCK_HISTORY INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_stock_history_product_id_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_stock_history_product_id`);

        // --- KEYS ---
        await queryRunner.query(`ALTER TABLE "product_stock_history" DROP CONSTRAINT "FK_product_stock_history_product_id"`);

        // --- PRODUCT_STOCK_HISTORY ---
        await queryRunner.query(`DROP TABLE "product_stock_history"`);
    }

}
