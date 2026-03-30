import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'libs', 'migrations', 'src');

function toClassName(name: string, timestamp: number): string {
    return name
        .replace(/[\[\]\-]/g, '')
        .replace(/_v(\d+)/gi, 'V$1')
        .replace(/_/g, '') + timestamp;
}

function generateTemplate(name: string, timestamp: number): string {
    const className = toClassName(name, timestamp);

    return `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${className} implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        // Write your SQL here.

    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // Write your rollback SQL here.

    }
}
`;
}

function createMigration(): void {
    // Extract migration name from arguments, ignoring flags (-, --, etc)
    const args = process.argv.slice(2).filter(arg => !arg.startsWith('-'));
    const name = args.join(' ').trim();

    if (!name) {
        console.error('❌ Migration name is required.');
        console.error('   Usage: npm run migration:create -- USERS-v1-CreateUserTable');
        process.exit(1);
    }

    if (!fs.existsSync(MIGRATIONS_DIR)) {
        fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${name}.ts`;
    const filePath = path.join(MIGRATIONS_DIR, fileName);

    if (fs.existsSync(filePath)) {
        console.error(`❌ Migration file already exists: ${fileName}`);
        process.exit(1);
    }

    fs.writeFileSync(filePath, generateTemplate(name, timestamp), 'utf8');

    console.log(`\n✅ Migration created successfully`);
    console.log(`   File: libs/migrations/src/${fileName}`);
    console.log(`   Class: ${toClassName(name, timestamp)}`);
}

createMigration();
