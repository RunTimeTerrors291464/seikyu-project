import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductRankingTablesV11773000000000 implements MigrationInterface {
    name = 'CreateProductRankingTablesV11773000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- PRODUCT_RANKING_DAILY ---
        await queryRunner.query(`
            CREATE TABLE "product_ranking_daily" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "total_price" numeric(10, 2) NOT NULL,
                "invoice_type" varchar(20) NOT NULL,
                "day" integer NOT NULL,
                "month" integer NOT NULL,
                "year" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_ranking_daily_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_ranking_daily" UNIQUE ("product_id", "invoice_type", "day", "month", "year")
            )
        `);

        // --- PRODUCT_RANKING_MONTHLY ---
        await queryRunner.query(`
            CREATE TABLE "product_ranking_monthly" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "revenue" numeric(10, 2) NOT NULL,
                "invoice_type" varchar(20) NOT NULL,
                "month" integer NOT NULL,
                "year" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_ranking_monthly_id" PRIMARY KEY ("id")
            )
        `);

        // --- PRODUCT_RANKING_YEARLY ---
        await queryRunner.query(`
            CREATE TABLE "product_ranking_yearly" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "revenue" numeric(10, 2) NOT NULL,
                "invoice_type" varchar(20) NOT NULL,
                "year" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_ranking_yearly_id" PRIMARY KEY ("id")
            )
        `);

        // --- FOREIGN KEYS ---
        await queryRunner.query(`
            ALTER TABLE "product_ranking_daily"
            ADD CONSTRAINT "FK_product_ranking_daily_product_id"
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "product_ranking_monthly"
            ADD CONSTRAINT "FK_product_ranking_monthly_product_id"
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "product_ranking_yearly"
            ADD CONSTRAINT "FK_product_ranking_yearly_product_id"
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_ranking_yearly" DROP CONSTRAINT "FK_product_ranking_yearly_product_id"`);
        await queryRunner.query(`ALTER TABLE "product_ranking_monthly" DROP CONSTRAINT "FK_product_ranking_monthly_product_id"`);
        await queryRunner.query(`ALTER TABLE "product_ranking_daily" DROP CONSTRAINT "FK_product_ranking_daily_product_id"`);
        await queryRunner.query(`DROP TABLE "product_ranking_yearly"`);
        await queryRunner.query(`DROP TABLE "product_ranking_monthly"`);
        await queryRunner.query(`DROP TABLE "product_ranking_daily"`);
    }

}
