import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterProductRankingRevenueToTotalPriceV21773000000001 implements MigrationInterface {
    name = 'AlterProductRankingRevenueToTotalPriceV21773000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_ranking_monthly" RENAME COLUMN "revenue" TO "total_price"`);
        await queryRunner.query(`ALTER TABLE "product_ranking_yearly" RENAME COLUMN "revenue" TO "total_price"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_ranking_yearly" RENAME COLUMN "total_price" TO "revenue"`);
        await queryRunner.query(`ALTER TABLE "product_ranking_monthly" RENAME COLUMN "total_price" TO "revenue"`);
    }

}
