import { NestFactory } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';

import { AppModule } from '@src/app.module';
import { UsersRepository } from '@src/users/repositories/users.repository';
import { ProductUnitsService } from '@src/productUnits/services/productUnits.service';
import { CreateProductUnitRequestDto } from '@libs/common/dtos/productUnits/crudProductUnitRequest.dto';
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';
import { CustomException } from '@libs/common/error-exceptions/customException';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';
import { Role } from '@libs/common/enums/role.enum';
import { UsersEntity } from '@src/users/entities/users.entity';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const IMPORT_DIR = path.join(process.cwd(), 'import');
const DEFAULT_IMPORT_BASENAME = 'product_import';
const DEFAULT_SHEET_NAME = 'Product Unit';
const HUNGARIAN_UNIT_NAME_HEADER = 'Unit Name* (Hungarian)';
const UNIT_DESCRIPTION_HEADER = 'Unit Description';
const SUPPORTED_IMPORT_EXTENSIONS = ['.xlsx', '.xlsm', '.xls'] as const;

interface ScriptOptions {
    filePath: string;
    sheetName?: string;
    userRef?: string;
    dryRun: boolean;
}

interface ParsedProductUnitRow {
    rowNumber: number;
    unitName: string;
    unitDescription?: string;
}

interface ImportSummary {
    total: number;
    created: number;
    skippedExisting: number;
    skippedDuplicateInFile: number;
    skippedInvalid: number;
    failed: number;
}

function printUsage(): void {
    console.log(`
Usage:
  npm run import:product-units [--dry-run]

Options:
  --user, -u       Optional Manager/Admin username or UUID for history createdBy
                   (default: auto-pick first active ADMIN, else MANAGER)
  --file, -f       Optional custom Excel path (default: import/${DEFAULT_IMPORT_BASENAME}.xlsx)
  --sheet, -s      Sheet name (default: auto-detect "${DEFAULT_SHEET_NAME}")
  --dry-run        Validate rows only; do not create product units
  --help, -h       Show this help message

Setup:
  1. Put your Excel file at: import/${DEFAULT_IMPORT_BASENAME}.xlsx
  2. Sheet must contain columns "${HUNGARIAN_UNIT_NAME_HEADER}" and "${UNIT_DESCRIPTION_HEADER}"
  3. Run: npm run import:product-units

Example:
  npm run import:product-units
  npm run import:product-units -- --dry-run
  npm run import:product-units -- --user mymanager
`);
}

function resolveDefaultImportFilePath(): string {
    for (const extension of SUPPORTED_IMPORT_EXTENSIONS) {
        const candidate = path.join(IMPORT_DIR, `${DEFAULT_IMPORT_BASENAME}${extension}`);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(
        `Import file not found. Place your Excel file at one of:\n` +
        SUPPORTED_IMPORT_EXTENSIONS
            .map((extension) => `  - ${path.join(IMPORT_DIR, `${DEFAULT_IMPORT_BASENAME}${extension}`)}`)
            .join('\n'),
    );
}

function resolveImportFilePath(fileArg: string): string {
    if (!fileArg) {
        return resolveDefaultImportFilePath();
    }

    const resolvedPath = path.isAbsolute(fileArg)
        ? fileArg
        : path.join(process.cwd(), fileArg);

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Excel file not found: ${resolvedPath}`);
    }

    return resolvedPath;
}

function detectProductUnitSheet(workbook: XLSX.WorkBook, preferredSheetName?: string): string {
    if (preferredSheetName) {
        if (!workbook.SheetNames.includes(preferredSheetName)) {
            throw new Error(
                `Sheet "${preferredSheetName}" was not found. Available sheets: ${workbook.SheetNames.join(', ')}`,
            );
        }
        return preferredSheetName;
    }

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
            header: 1,
            defval: '',
            raw: false,
        });

        const hasHeader = rows.some((row) =>
            Array.isArray(row) && row.some((cell) => normalizeCell(cell) === HUNGARIAN_UNIT_NAME_HEADER),
        );

        if (hasHeader) {
            return sheetName;
        }
    }

    if (workbook.SheetNames.includes(DEFAULT_SHEET_NAME)) {
        return DEFAULT_SHEET_NAME;
    }

    throw new Error(
        `Could not detect a product unit sheet. Expected sheet "${DEFAULT_SHEET_NAME}" ` +
        `or a sheet containing "${HUNGARIAN_UNIT_NAME_HEADER}".`,
    );
}

function parseArgs(argv: string[]): ScriptOptions | null {
    let filePath = '';
    let sheetName: string | undefined;
    let userRef = process.env.IMPORT_USER_USERNAME ?? '';
    let dryRun = false;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--help' || arg === '-h') {
            printUsage();
            return null;
        }

        if (arg === '--dry-run') {
            dryRun = true;
            continue;
        }

        const next = argv[i + 1];
        const readValue = (): string => {
            if (!next) {
                throw new Error(`Missing value for ${arg}`);
            }
            i++;
            return next;
        };

        if (arg === '--file' || arg === '-f') {
            filePath = readValue();
            continue;
        }

        if (arg === '--sheet' || arg === '-s') {
            sheetName = readValue();
            continue;
        }

        if (arg === '--user' || arg === '-u') {
            userRef = readValue();
            continue;
        }
    }

    return {
        filePath: resolveImportFilePath(filePath),
        sheetName,
        ...(userRef ? { userRef } : {}),
        dryRun,
    };
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function normalizeCell(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value).trim();
}

function findColumnIndex(headers: unknown[], headerName: string): number {
    const index = headers.findIndex((header) => normalizeCell(header) === headerName);
    if (index === -1) {
        throw new Error(`Column "${headerName}" was not found in the sheet header row.`);
    }
    return index;
}

function parseProductUnitRows(filePath: string, sheetName?: string): { rows: ParsedProductUnitRow[]; sheet: string } {
    const workbook = XLSX.readFile(filePath, { cellDates: false });
    const resolvedSheetName = detectProductUnitSheet(workbook, sheetName);

    const worksheet = workbook.Sheets[resolvedSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: '',
        raw: false,
    });

    const headerRowIndex = rows.findIndex((row) =>
        Array.isArray(row) && row.some((cell) => normalizeCell(cell) === HUNGARIAN_UNIT_NAME_HEADER),
    );

    if (headerRowIndex === -1) {
        throw new Error(`Could not find a header row containing "${HUNGARIAN_UNIT_NAME_HEADER}".`);
    }

    const headers = rows[headerRowIndex];
    if (!Array.isArray(headers)) {
        throw new Error('Invalid header row in Excel sheet.');
    }

    const unitNameIndex = findColumnIndex(headers, HUNGARIAN_UNIT_NAME_HEADER);
    const unitDescriptionIndex = findColumnIndex(headers, UNIT_DESCRIPTION_HEADER);

    const parsedRows: ParsedProductUnitRow[] = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row)) {
            continue;
        }

        const unitName = normalizeCell(row[unitNameIndex]);
        if (!unitName) {
            continue;
        }

        const unitDescription = normalizeCell(row[unitDescriptionIndex]) || undefined;

        parsedRows.push({
            rowNumber: i + 1,
            unitName,
            unitDescription,
        });
    }

    if (parsedRows.length === 0) {
        throw new Error('No product unit rows were found in the Excel sheet.');
    }

    return { rows: parsedRows, sheet: resolvedSheetName };
}

function buildAccessTokenPayload(user: UsersEntity): AccessTokenPayload {
    const roles: Role[] = [];
    if (user.isAdmin) roles.push(Role.ADMIN);
    if (user.isManager) roles.push(Role.MANAGER);
    if (user.isCashier) roles.push(Role.CASHIER);

    return {
        id: user.id,
        username: user.username,
        roles,
        refreshTokenId: 'import-script',
    };
}

async function resolveDefaultImportUser(dataSource: DataSource): Promise<UsersEntity> {
    const usersRepository = dataSource.getRepository(UsersEntity);

    const admin = await usersRepository.findOne({
        where: { isAdmin: true, isActive: true },
        order: { createdAt: 'ASC' },
    });
    if (admin) {
        return admin;
    }

    const manager = await usersRepository.findOne({
        where: { isManager: true, isActive: true },
        order: { createdAt: 'ASC' },
    });
    if (manager) {
        return manager;
    }

    throw new Error(
        'No active ADMIN or MANAGER user found in the database. Create one first or pass --user.',
    );
}

async function resolveImportUser(
    usersRepository: UsersRepository,
    dataSource: DataSource,
    userRef?: string,
): Promise<UsersEntity> {
    if (!userRef) {
        return resolveDefaultImportUser(dataSource);
    }

    const user = isUuid(userRef)
        ? await usersRepository.getUserById(userRef)
        : await usersRepository.getUserByUsername(userRef);

    if (!user) {
        throw new Error(`User "${userRef}" was not found.`);
    }

    if (!user.isActive) {
        throw new Error(`User "${user.username}" is inactive and cannot be used for import.`);
    }

    if (!user.isManager && !user.isAdmin) {
        throw new Error(`User "${user.username}" must have MANAGER or ADMIN role to import product units.`);
    }

    return user;
}

async function validateCreateDto(dto: CreateProductUnitRequestDto): Promise<string[]> {
    const instance = plainToInstance(CreateProductUnitRequestDto, dto);
    const errors = await validate(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
    });

    if (errors.length === 0) {
        return [];
    }

    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

function getCustomExceptionErrorCode(error: unknown): number | null {
    if (!(error instanceof CustomException)) {
        return null;
    }

    const response = error.getResponse();
    if (typeof response === 'object' && response !== null && 'errorCode' in response) {
        return Number((response as { errorCode: number }).errorCode);
    }

    return null;
}

async function importProductUnits(options: ScriptOptions): Promise<ImportSummary> {
    const { rows, sheet } = parseProductUnitRows(options.filePath, options.sheetName);
    const summary: ImportSummary = {
        total: rows.length,
        created: 0,
        skippedExisting: 0,
        skippedDuplicateInFile: 0,
        skippedInvalid: 0,
        failed: 0,
    };

    const seenUnitNames = new Set<string>();

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });

    try {
        const productUnitsService = app.get(ProductUnitsService);
        const usersRepository = app.get(UsersRepository);
        const dataSource = app.get(DataSource);
        const importUser = await resolveImportUser(usersRepository, dataSource, options.userRef);
        const userPayload = buildAccessTokenPayload(importUser);

        console.log(`\n[import:product-units] File: ${options.filePath}`);
        console.log(`[import:product-units] Sheet: ${sheet}`);
        console.log(`[import:product-units] Rows: ${rows.length}`);
        console.log(`[import:product-units] Import user: ${importUser.username} (${importUser.id})${options.userRef ? '' : ' [auto-selected]'}`);
        console.log(`[import:product-units] Mode: ${options.dryRun ? 'DRY RUN' : 'CREATE'}\n`);

        for (const row of rows) {
            const normalizedUnitName = row.unitName.toLocaleLowerCase();

            if (seenUnitNames.has(normalizedUnitName)) {
                summary.skippedDuplicateInFile++;
                console.log(`[SKIP duplicate in file] row ${row.rowNumber}: ${row.unitName}`);
                continue;
            }
            seenUnitNames.add(normalizedUnitName);

            const dto: CreateProductUnitRequestDto = {
                unitName: row.unitName,
                ...(row.unitDescription ? { unitDescription: row.unitDescription } : {}),
            };

            const validationErrors = await validateCreateDto(dto);
            if (validationErrors.length > 0) {
                summary.skippedInvalid++;
                console.log(`[SKIP invalid] row ${row.rowNumber}: ${row.unitName}`);
                validationErrors.forEach((message) => console.log(`  - ${message}`));
                continue;
            }

            const existing = await productUnitsService.getProductUnitByUnitName(dto.unitName);
            if (existing) {
                summary.skippedExisting++;
                console.log(`[SKIP existing] row ${row.rowNumber}: ${row.unitName}`);
                continue;
            }

            if (options.dryRun) {
                summary.created++;
                console.log(`[OK dry-run] row ${row.rowNumber}: ${row.unitName}`);
                continue;
            }

            try {
                const created = await productUnitsService.createNewProductUnit(dto, userPayload);
                summary.created++;
                console.log(`[CREATED] row ${row.rowNumber}: ${created.unitName} (${created.id})`);
            } catch (error) {
                const errorCode = getCustomExceptionErrorCode(error);

                if (errorCode === ErrorCode.PRODUCT_UNIT_NAME_ALREADY_EXISTS) {
                    summary.skippedExisting++;
                    console.log(`[SKIP existing] row ${row.rowNumber}: ${row.unitName}`);
                    continue;
                }

                summary.failed++;
                const message = error instanceof Error ? error.message : String(error);
                console.log(`[FAILED] row ${row.rowNumber}: ${row.unitName}`);
                console.log(`  - ${message}`);
            }
        }

        return summary;
    } finally {
        await app.close();
    }
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    if (!options) {
        return;
    }

    const summary = await importProductUnits(options);

    console.log('\n[import:product-units] Summary');
    console.log(`  Total rows:              ${summary.total}`);
    console.log(`  Created:                 ${summary.created}`);
    console.log(`  Skipped (already exists):${summary.skippedExisting}`);
    console.log(`  Skipped (duplicate file):${summary.skippedDuplicateInFile}`);
    console.log(`  Skipped (invalid):       ${summary.skippedInvalid}`);
    console.log(`  Failed:                  ${summary.failed}`);

    if (summary.failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error('\n[import:product-units] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
