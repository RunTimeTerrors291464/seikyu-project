import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthTableV11770223783339 implements MigrationInterface {
    name = 'CreateAuthTableV11770223783339'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // --- REFRESH_TOKENS TABLE ---
        await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL, 
                "user_id" uuid NOT NULL, 
                "refresh_token" text NOT NULL, 
                "expires_at" TIMESTAMP NOT NULL, 
                CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }

}
