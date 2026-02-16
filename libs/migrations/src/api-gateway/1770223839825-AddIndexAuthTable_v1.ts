import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexAuthTableV11770223839825 implements MigrationInterface {
    name = 'AddIndexAuthTableV11770223839825'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- REFRESH_TOKENS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE UNIQUE INDEX idx_auth_refresh_token 
            ON refresh_tokens (refresh_token)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_auth_expires_at 
            ON refresh_tokens (expires_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_auth_user_id 
            ON refresh_tokens (user_id)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_auth_user_id_expires_at 
            ON refresh_tokens (user_id, expires_at)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- REFRESH_TOKENS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_auth_user_id_expires_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_auth_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_auth_expires_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_auth_refresh_token`);
    }

}
