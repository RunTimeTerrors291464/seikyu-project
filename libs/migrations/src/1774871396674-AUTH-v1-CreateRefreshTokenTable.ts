import { MigrationInterface, QueryRunner } from 'typeorm';

export class AUTHv1CreateRefreshTokenTable1774871396674 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- REFRESH TOKENS ---
        await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "refresh_token" text NOT NULL,
                "expires_at" TIMESTAMP NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "version" int NOT NULL DEFAULT 1,
                CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_refresh_tokens_refresh_token" UNIQUE ("refresh_token"),
                CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
            )
        `);

        // --- INDEXES ---
        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_user_id
            ON refresh_tokens (user_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_expires_at
            ON refresh_tokens (expires_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_created_at
            ON refresh_tokens (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_updated_at
            ON refresh_tokens (updated_at)
        `);

        // --- Multi column: count active tokens per user, delete by user ---
        await queryRunner.query(`
            CREATE INDEX idx_refresh_tokens_user_id_expires_at
            ON refresh_tokens (user_id, expires_at)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id_expires_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_expires_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_refresh_tokens_user_id`);

        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    }
}
