import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexUserTableV11770117307047 implements MigrationInterface {
    name = 'AddIndexUserTableV11770117307047'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        // Install pg_trgm extension and unaccent extension.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);

        // --- USERS INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE UNIQUE INDEX idx_users_username 
            ON users (username)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_active 
            ON users (active)
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
            CREATE INDEX idx_users_last_name 
            ON users (last_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_first_name 
            ON users (first_name)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_users_active_created_at 
            ON users (active, created_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_active_updated_at 
            ON users (active, updated_at)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_active_last_name 
            ON users (active, last_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_active_first_name 
            ON users (active, first_name)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_users_active_username 
            ON users (active, username)
        `);

        // --- GIN index ---
        // Add search_vector_name column for full-text search on name fields.
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "search_vector_name" tsvector
        `);

        // Create function to update search_vector_name with unaccent support.
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
            $$ LANGUAGE plpgsql IMMUTABLE;
        `);

        // Create trigger to automatically update search_vector_name on INSERT or UPDATE.
        await queryRunner.query(`
            CREATE TRIGGER trg_update_search_vector_name
            BEFORE INSERT OR UPDATE ON "users"
            FOR EACH ROW
            EXECUTE FUNCTION update_search_vector_name();
        `);

        // Create GIN index on search_vector_name for full-text search.
        await queryRunner.query(`
            CREATE INDEX idx_users_search_vector_name_gin 
            ON users USING GIN (search_vector_name)
        `);

        // Create GIN Trigram index on username for substring search.
        await queryRunner.query(`
            CREATE INDEX idx_users_username_trigram 
            ON users USING GIN (username gin_trgm_ops)
        `);

        // --- USER_ROLES INDEXES ---
        // --- Single column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_user_roles_user_id 
            ON user_roles (user_id)
        `);

        await queryRunner.query(`
            CREATE INDEX idx_user_roles_role 
            ON user_roles (role)
        `);

        // --- Multi column B-tree index ---
        await queryRunner.query(`
            CREATE INDEX idx_user_roles_user_id_role 
            ON user_roles (user_id, role)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // --- USERS INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active_username`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active_first_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active_last_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active_created_at`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_first_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_last_name`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_updated_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_created_at`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_active`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_username`);

        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_username_trigram`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_search_vector_name_gin`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS trg_update_search_vector_name ON "users"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_search_vector_name()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS search_vector_name`);

        // --- USER_ROLES INDEXES ---
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_roles_user_id_role`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_roles_role`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_user_roles_user_id`);

    }

}
