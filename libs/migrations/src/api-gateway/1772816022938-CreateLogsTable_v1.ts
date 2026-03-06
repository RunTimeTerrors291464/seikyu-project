import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLogsTableV11770223839826 implements MigrationInterface {
    name = 'CreateLogsTableV11770223839826'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- CREATE TABLE ---
        await queryRunner.query(`
            CREATE TABLE logs (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                role varchar NOT NULL,
                action_user_id uuid,
                action varchar NOT NULL,
                reference_type varchar,
                reference_id uuid,
                metadata json,
                created_at timestamp NOT NULL DEFAULT now(),
                CONSTRAINT pk_logs_id PRIMARY KEY (id)
            )
        `);

        // --- LOGS INDEXES ---
        await queryRunner.query(`
            CREATE INDEX idx_logs_role 
            ON logs (role)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_logs_action_user_id 
            ON logs (action_user_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_logs_action 
            ON logs (action)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_logs_created_at 
            ON logs (created_at)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- LOGS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_logs_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_logs_action`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_logs_action_user_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_logs_role`);

        // --- CREATE TABLE ---
        await queryRunner.query(`DROP TABLE logs`);
    }

}
