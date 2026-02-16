import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTableV11769948140686 implements MigrationInterface {
    name = 'CreateUserTableV11769948140686'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // --- EXTENSIONS ---
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // --- USER_ROLES ---
        await queryRunner.query(`CREATE TYPE "public"."user_roles_role_enum" AS ENUM('1', '2', '3')`);

        await queryRunner.query(`
            CREATE TABLE "user_roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "user_id" uuid NOT NULL, 
                "role" "public"."user_roles_role_enum" NOT NULL, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id")
            )
        `);

        // --- USERS ---
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                "first_name" character varying(64) NOT NULL, 
                "middle_name" character varying(64), 
                "last_name" character varying(64), 
                "username" character varying(64) NOT NULL, 
                "password" character varying(255) NOT NULL, 
                "active" boolean NOT NULL DEFAULT true, 
                "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // --- KEYS ---
        await queryRunner.query(`
            ALTER TABLE "user_roles" 
            ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TYPE "public"."user_roles_role_enum"`);
    }

}
