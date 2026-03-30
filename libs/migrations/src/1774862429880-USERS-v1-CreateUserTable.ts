import { MigrationInterface, QueryRunner } from 'typeorm';

export class USERSv1CreateUserTable1774862429880 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);

        // --- USERS ---
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "first_name" character varying(64) NOT NULL, 
                "middle_name" character varying(64), 
                "last_name" character varying(64), 
                "search_vector_name" tsvector, 
                "username" character varying(64) NOT NULL, 
                "password" character varying(255) NOT NULL, 
                "is_active" boolean NOT NULL DEFAULT true, 
                "is_admin" boolean NOT NULL DEFAULT false, 
                "is_manager" boolean NOT NULL DEFAULT false, 
                "is_cashier" boolean NOT NULL DEFAULT false, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "version" int NOT NULL DEFAULT 1, 
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"), 
                CONSTRAINT "UQ_users_username" UNIQUE ("username")
            )
        `);

        // --- INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_users_is_active
            ON users (is_active)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_created_at
            ON users (created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_updated_at
            ON users (updated_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_first_name
            ON users (first_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_last_name
            ON users (last_name)
        `);

        // --- Partial index for role columns ---
        await queryRunner.query(`
            CREATE INDEX idx_users_is_admin
            ON users (is_admin)
            WHERE is_admin = true
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_is_manager
            ON users (is_manager)
            WHERE is_manager = true
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_is_cashier
            ON users (is_cashier)
            WHERE is_cashier = true
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_users_is_active_created_at
            ON users (is_active, created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_is_active_updated_at
            ON users (is_active, updated_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_is_active_first_name
            ON users (is_active, first_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_is_active_last_name
            ON users (is_active, last_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_is_active_username
            ON users (is_active, username)
        `);

        // --- GIN index ---
        // Create function to auto-update search_vector_name with unaccent support.
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_search_vector_name()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.search_vector_name := to_tsvector('simple',
                    unaccent(
                        COALESCE(NEW.first_name, '') || ' ' ||
                        COALESCE(NEW.middle_name, '') || ' ' ||
                        COALESCE(NEW.last_name, '')
                    )
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create trigger to automatically update search_vector_name on INSERT or UPDATE.
        await queryRunner.query(`
            CREATE TRIGGER trg_update_search_vector_name
            BEFORE INSERT OR UPDATE ON "users"
            FOR EACH ROW
            EXECUTE FUNCTION update_search_vector_name()
        `);

        // GIN index for search_vector_name.
        await queryRunner.query(`
            CREATE INDEX idx_users_search_vector_name_gin
            ON users USING GIN (search_vector_name)
        `);

        // GIN index for username.
        await queryRunner.query(`
            CREATE INDEX idx_users_username_trigram
            ON users USING GIN (username gin_trgm_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active_username`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active_last_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active_first_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active_created_at`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_cashier`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_manager`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_admin`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_last_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_first_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_username_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_search_vector_name_gin`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trg_update_search_vector_name ON "users"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_search_vector_name()`);

        // --- UUID v4 FUNCTION ---
        await queryRunner.query(`DROP FUNCTION IF EXISTS uuid_generate_v4()`);

        // --- TABLE ---
        await queryRunner.query(`DROP TABLE "users"`);
    }
}

