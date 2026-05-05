import { MigrationInterface, QueryRunner } from 'typeorm';

export class DASHBOARDv1CreateProductRankingTables1775287443307 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
            CREATE TABLE "product_ranking_daily" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "total_price" numeric(10,2) NOT NULL,
                "invoice_type" character varying(20) NOT NULL,
                "day" integer NOT NULL,
                "month" integer NOT NULL,
                "year" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_ranking_daily_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_ranking_daily_product_invoice_date" UNIQUE ("product_id", "invoice_type", "day", "month", "year"),
                CONSTRAINT "FK_product_ranking_daily_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "product_ranking_monthly" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "total_price" numeric(10,2) NOT NULL,
                "invoice_type" character varying(20) NOT NULL,
                "month" integer NOT NULL,
                "year" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_ranking_monthly_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_ranking_monthly_product_invoice_month_year" UNIQUE ("product_id", "invoice_type", "month", "year"),
                CONSTRAINT "FK_product_ranking_monthly_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "product_ranking_yearly" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "total_price" numeric(10,2) NOT NULL,
                "invoice_type" character varying(20) NOT NULL,
                "year" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_product_ranking_yearly_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_product_ranking_yearly_product_invoice_year" UNIQUE ("product_id", "invoice_type", "year"),
                CONSTRAINT "FK_product_ranking_yearly_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_product_ranking_daily_lookup"
            ON "product_ranking_daily" ("year", "month", "day", "invoice_type")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_product_ranking_monthly_lookup"
            ON "product_ranking_monthly" ("year", "month", "invoice_type")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_product_ranking_yearly_lookup"
            ON "product_ranking_yearly" ("year", "invoice_type")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_ranking_yearly_lookup"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_ranking_monthly_lookup"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_product_ranking_daily_lookup"`);
        await queryRunner.query(`DROP TABLE "product_ranking_yearly"`);
        await queryRunner.query(`DROP TABLE "product_ranking_monthly"`);
        await queryRunner.query(`DROP TABLE "product_ranking_daily"`);
    }
}
