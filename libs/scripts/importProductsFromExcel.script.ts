import { randomUUID } from 'crypto';

import { NestFactory } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { DataSource } from 'typeorm';

import { AppModule } from '@src/app.module';
import { UsersRepository } from '@src/users/repositories/users.repository';
import { ProductsService } from '@src/products/services/products.service';
import { ProductsEntity } from '@src/products/entities/products.entity';
import { ProductUnitsEntity } from '@src/productUnits/entities/productUnits.entity';
import { CreateProductRequestDto } from '@libs/common/dtos/products/crudProductRequest.dto';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';
import { InvoiceType } from '@libs/common/enums/invoiceType.enum';
import { StockActionType } from '@libs/common/enums/stockActionType.enum';
import {
    buildAccessTokenPayload,
    DEFAULT_IMPORT_BASENAME,
    findColumnIndex,
    getCustomExceptionErrorCode,
    normalizeCell,
    padSku,
    parseImportQuantity,
    parseOptionalThreshold,
    parsePrice,
    resolveImportFilePath,
    resolveImportUser,
} from './importExcel.util';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const DEFAULT_SHEET_NAME = 'Product';
const SKU_HEADER = 'SKU*';
const PRODUCT_UNIT_HEADER = 'Product Unit*';
const IMPORT_PRICE_HEADER = 'Import Price*';
const SELLING_PRICE_HEADER = 'Selling Price*';
const REORDER_THRESHOLD_HEADER = 'Reorder Threshold';
const PRODUCT_DESCRIPTION_HEADER = 'Product Description';
const PRODUCT_NAME_1_HEADER = 'Product Name 1';
const QUANTITY_HEADER = 'Quantity';

enum ProductImportSkipCategory {
    SKU_EXCEEDED_13_CHARS = 'SKU exceeded 13 characters',
    SKU_INVALID = 'Invalid SKU',
    DUPLICATE_SKU_IN_FILE = 'Duplicate SKU in file',
    SKU_ALREADY_EXISTS = 'SKU already exists in database',
    PRODUCT_UNIT_EMPTY = 'Product unit is empty',
    PRODUCT_UNIT_NOT_FOUND = 'Product unit not found',
    PRODUCT_UNIT_INACTIVE = 'Product unit is inactive',
    INVALID_IMPORT_PRICE = 'Invalid import price',
    INVALID_SELLING_PRICE = 'Invalid selling price',
    INVALID_REORDER_THRESHOLD = 'Invalid reorder threshold',
    INVALID_QUANTITY = 'Invalid quantity',
    DTO_VALIDATION = 'DTO validation failed',
    OTHER = 'Other',
}

interface ScriptOptions {
    filePath: string;
    sheetName?: string;
    userRef?: string;
    dryRun: boolean;
    verbose: boolean;
}

interface ParsedProductRow {
    rowNumber: number;
    rawSku: string;
    sku: string;
    productUnitName: string;
    productUnitId: string;
    productDescription?: string;
    importPrice: number;
    sellingPrice: number;
    reorderThreshold?: number;
    quantity: number;
}

interface ImportSummary {
    total: number;
    created: number;
    failed: number;
    skipByCategory: Map<ProductImportSkipCategory, number>;
}

function printUsage(): void {
    console.log(`
Usage:
  npm run import:products [--dry-run]

Options:
  --user, -u       Optional Manager/Admin username or UUID for history createdBy
  --file, -f       Optional custom Excel path (default: import/${DEFAULT_IMPORT_BASENAME}.xlsx)
  --sheet, -s      Sheet name (default: auto-detect "${DEFAULT_SHEET_NAME}")
  --dry-run        Validate all rows only; do not create products or stock
  --verbose, -v    Log each skipped row with row number and detail
  --help, -h       Show this help message

Excel mapping:
  SKU*               -> sku (left-pad with 0 to 13 digits)
  Product Unit*      -> productUnitId (lookup by unit name)
  Product Description-> productDescription (product name goes here)
  Import/Selling Price*, Reorder Threshold, Quantity

Skip rules:
  - SKU empty or longer than 13 before padding
  - Invalid / non-integer quantity, or quantity outside 4-byte int range
  - Product unit missing, not found, or inactive
  - Duplicate SKU in file or already in database

Example:
  npm run import:products -- --dry-run
  npm run import:products
`);
}

function parseArgs(argv: string[]): ScriptOptions | null {
    let filePath = '';
    let sheetName: string | undefined;
    let userRef = process.env.IMPORT_USER_USERNAME ?? '';
    let dryRun = false;
    let verbose = false;

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

        if (arg === '--verbose' || arg === '-v') {
            verbose = true;
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
        verbose,
    };
}

function detectProductSheet(workbook: XLSX.WorkBook, preferredSheetName?: string): string {
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
            Array.isArray(row) && row.some((cell) => normalizeCell(cell) === SKU_HEADER),
        );

        if (hasHeader) {
            return sheetName;
        }
    }

    if (workbook.SheetNames.includes(DEFAULT_SHEET_NAME)) {
        return DEFAULT_SHEET_NAME;
    }

    throw new Error(
        `Could not detect a product sheet. Expected sheet "${DEFAULT_SHEET_NAME}" ` +
        `or a sheet containing "${SKU_HEADER}".`,
    );
}

function parseProductRows(filePath: string, sheetName?: string): { rows: unknown[][]; sheet: string; headerRowIndex: number } {
    const workbook = XLSX.readFile(filePath, { cellDates: false });
    const resolvedSheetName = detectProductSheet(workbook, sheetName);
    const worksheet = workbook.Sheets[resolvedSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: '',
        raw: false,
    });

    const headerRowIndex = rows.findIndex((row) =>
        Array.isArray(row) && row.some((cell) => normalizeCell(cell) === SKU_HEADER),
    );

    if (headerRowIndex === -1) {
        throw new Error(`Could not find a header row containing "${SKU_HEADER}".`);
    }

    return { rows, sheet: resolvedSheetName, headerRowIndex };
}

function buildProductUnitMap(units: ProductUnitsEntity[]): Map<string, ProductUnitsEntity> {
    const map = new Map<string, ProductUnitsEntity>();
    for (const unit of units) {
        map.set(unit.unitName.toLocaleLowerCase(), unit);
    }
    return map;
}

function resolveProductDescription(
    productDescription: string,
    productName1: string,
): string | undefined {
    const description = productDescription || productName1;
    return description || undefined;
}

function recordSkip(
    summary: ImportSummary,
    category: ProductImportSkipCategory,
    rowNumber: number,
    rawSku: string,
    detail: string,
    verbose: boolean,
): void {
    summary.skipByCategory.set(category, (summary.skipByCategory.get(category) ?? 0) + 1);

    if (verbose) {
        console.log(`[SKIP] row ${rowNumber} sku="${rawSku}": ${detail}`);
    }
}

function getSkuSkipCategory(reason: string): ProductImportSkipCategory {
    if (reason.includes('exceeds 13 characters')) {
        return ProductImportSkipCategory.SKU_EXCEEDED_13_CHARS;
    }

    return ProductImportSkipCategory.SKU_INVALID;
}

async function validateCreateProductDto(dto: CreateProductRequestDto): Promise<string[]> {
    const instance = plainToInstance(CreateProductRequestDto, dto);
    const errors = await validate(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
    });

    if (errors.length === 0) {
        return [];
    }

    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

async function importProducts(options: ScriptOptions): Promise<ImportSummary> {
    const { rows, sheet, headerRowIndex } = parseProductRows(options.filePath, options.sheetName);
    const headers = rows[headerRowIndex];
    if (!Array.isArray(headers)) {
        throw new Error('Invalid header row in Excel sheet.');
    }

    const skuIndex = findColumnIndex(headers, SKU_HEADER);
    const productUnitIndex = findColumnIndex(headers, PRODUCT_UNIT_HEADER);
    const importPriceIndex = findColumnIndex(headers, IMPORT_PRICE_HEADER);
    const sellingPriceIndex = findColumnIndex(headers, SELLING_PRICE_HEADER);
    const reorderThresholdIndex = findColumnIndex(headers, REORDER_THRESHOLD_HEADER);
    const productDescriptionIndex = findColumnIndex(headers, PRODUCT_DESCRIPTION_HEADER);
    const productName1Index = headers.findIndex((header) => normalizeCell(header) === PRODUCT_NAME_1_HEADER);
    const quantityIndex = findColumnIndex(headers, QUANTITY_HEADER);

    const summary: ImportSummary = {
        total: 0,
        created: 0,
        failed: 0,
        skipByCategory: new Map(),
    };

    const seenSkus = new Set<string>();
    const importBatchId = randomUUID();

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });

    try {
        const productsService = app.get(ProductsService);
        const usersRepository = app.get(UsersRepository);
        const dataSource = app.get(DataSource);
        const importUser = await resolveImportUser(usersRepository, dataSource, options.userRef);
        const userPayload = buildAccessTokenPayload(importUser);

        const allUnits = await dataSource.getRepository(ProductUnitsEntity).find();
        const unitMap = buildProductUnitMap(allUnits);
        const existingSkus = new Set(
            (await dataSource.getRepository(ProductsEntity).find({ select: ['sku'] })).map((product) => product.sku),
        );

        const dataRowCount = rows.length - headerRowIndex - 1;
        console.log(`\n[import:products] File: ${options.filePath}`);
        console.log(`[import:products] Sheet: ${sheet}`);
        console.log(`[import:products] Rows: ${dataRowCount}`);
        console.log(`[import:products] Product units loaded: ${allUnits.length}`);
        console.log(`[import:products] Existing SKUs loaded: ${existingSkus.size}`);
        console.log(`[import:products] Import user: ${importUser.username} (${importUser.id})${options.userRef ? '' : ' [auto-selected]'}`);
        console.log(`[import:products] Mode: ${options.dryRun ? 'DRY RUN' : 'CREATE'}\n`);

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!Array.isArray(row)) {
                continue;
            }

            const rowNumber = i + 1;
            const rawSku = normalizeCell(row[skuIndex]);
            if (!rawSku) {
                continue;
            }

            summary.total++;

            if ((summary.total % 5000) === 0) {
                console.log(`[import:products] Progress: ${summary.total}/${dataRowCount} rows checked...`);
            }

            const paddedSku = padSku(rawSku);
            if (!paddedSku.ok) {
                recordSkip(
                    summary,
                    getSkuSkipCategory(paddedSku.reason),
                    rowNumber,
                    rawSku,
                    paddedSku.reason,
                    options.verbose,
                );
                continue;
            }

            if (seenSkus.has(paddedSku.sku)) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.DUPLICATE_SKU_IN_FILE,
                    rowNumber,
                    rawSku,
                    `Duplicate SKU in file: ${paddedSku.sku}.`,
                    options.verbose,
                );
                continue;
            }
            seenSkus.add(paddedSku.sku);

            if (existingSkus.has(paddedSku.sku)) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.SKU_ALREADY_EXISTS,
                    rowNumber,
                    rawSku,
                    `SKU already exists in database: ${paddedSku.sku}.`,
                    options.verbose,
                );
                continue;
            }

            const productUnitName = normalizeCell(row[productUnitIndex]);
            if (!productUnitName) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.PRODUCT_UNIT_EMPTY,
                    rowNumber,
                    rawSku,
                    'Product unit is empty.',
                    options.verbose,
                );
                continue;
            }

            const productUnit = unitMap.get(productUnitName.toLocaleLowerCase());
            if (!productUnit) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.PRODUCT_UNIT_NOT_FOUND,
                    rowNumber,
                    rawSku,
                    `Product unit not found: "${productUnitName}".`,
                    options.verbose,
                );
                continue;
            }

            if (!productUnit.isActive) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.PRODUCT_UNIT_INACTIVE,
                    rowNumber,
                    rawSku,
                    `Product unit is inactive: "${productUnitName}".`,
                    options.verbose,
                );
                continue;
            }

            const importPrice = parsePrice(row[importPriceIndex], IMPORT_PRICE_HEADER);
            if (!importPrice.ok) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.INVALID_IMPORT_PRICE,
                    rowNumber,
                    rawSku,
                    importPrice.reason,
                    options.verbose,
                );
                continue;
            }

            const sellingPrice = parsePrice(row[sellingPriceIndex], SELLING_PRICE_HEADER);
            if (!sellingPrice.ok) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.INVALID_SELLING_PRICE,
                    rowNumber,
                    rawSku,
                    sellingPrice.reason,
                    options.verbose,
                );
                continue;
            }

            const reorderThreshold = parseOptionalThreshold(row[reorderThresholdIndex]);
            if (!reorderThreshold.ok) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.INVALID_REORDER_THRESHOLD,
                    rowNumber,
                    rawSku,
                    reorderThreshold.reason,
                    options.verbose,
                );
                continue;
            }

            const quantity = parseImportQuantity(row[quantityIndex]);
            if (!quantity.ok) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.INVALID_QUANTITY,
                    rowNumber,
                    rawSku,
                    quantity.reason,
                    options.verbose,
                );
                continue;
            }

            const productDescription = resolveProductDescription(
                normalizeCell(row[productDescriptionIndex]),
                productName1Index >= 0 ? normalizeCell(row[productName1Index]) : '',
            );

            const dto: CreateProductRequestDto = {
                sku: paddedSku.sku,
                productNames: [productDescription || paddedSku.sku],
                productUnitId: productUnit.id,
                importPrice: importPrice.value,
                sellingPrice: sellingPrice.value,
                ...(productDescription ? { productDescription } : {}),
                ...(reorderThreshold.value !== undefined ? { reorderThreshold: reorderThreshold.value } : {}),
            };

            const validationErrors = await validateCreateProductDto(dto);
            if (validationErrors.length > 0) {
                recordSkip(
                    summary,
                    ProductImportSkipCategory.DTO_VALIDATION,
                    rowNumber,
                    rawSku,
                    validationErrors.join('; '),
                    options.verbose,
                );
                continue;
            }

            const parsedRow: ParsedProductRow = {
                rowNumber,
                rawSku,
                sku: paddedSku.sku,
                productUnitName,
                productUnitId: productUnit.id,
                productDescription,
                importPrice: importPrice.value,
                sellingPrice: sellingPrice.value,
                reorderThreshold: reorderThreshold.value,
                quantity: quantity.quantity,
            };

            if (options.dryRun) {
                summary.created++;
                if (options.verbose) {
                    console.log(
                        `[OK dry-run] row ${parsedRow.rowNumber}: sku=${parsedRow.sku}, unit=${parsedRow.productUnitName}, qty=${parsedRow.quantity}`,
                    );
                }
                continue;
            }

            try {
                const created = await productsService.createNewProduct(dto, userPayload);

                if (parsedRow.quantity !== 0) {
                    await productsService.updateProductInventoryBulk({
                        invoiceType: InvoiceType.STOCK_ADJUSTMENT,
                        invoiceId: importBatchId,
                        products: [{
                            id: created.id,
                            quantity: parsedRow.quantity,
                            action: StockActionType.ADD,
                        }],
                    });
                }

                summary.created++;
                existingSkus.add(parsedRow.sku);

                if (options.verbose) {
                    console.log(
                        `[CREATED] row ${parsedRow.rowNumber}: sku=${created.sku}, qty=${parsedRow.quantity} (${created.id})`,
                    );
                }
            } catch (error) {
                const errorCode = getCustomExceptionErrorCode(error);

                if (errorCode === ErrorCode.PRODUCT_SKU_ALREADY_EXISTS) {
                    existingSkus.add(parsedRow.sku);
                    recordSkip(
                        summary,
                        ProductImportSkipCategory.SKU_ALREADY_EXISTS,
                        rowNumber,
                        rawSku,
                        `SKU already exists in database: ${parsedRow.sku}.`,
                        options.verbose,
                    );
                    continue;
                }

                summary.failed++;
                const message = error instanceof Error ? error.message : String(error);
                recordSkip(
                    summary,
                    ProductImportSkipCategory.OTHER,
                    rowNumber,
                    rawSku,
                    message,
                    true,
                );
            }
        }

        return summary;
    } finally {
        await app.close();
    }
}

function getTotalSkipped(summary: ImportSummary): number {
    return [...summary.skipByCategory.values()].reduce((total, count) => total + count, 0);
}

function printImportSummary(summary: ImportSummary): void {
    console.log('\n[import:products] Summary');
    console.log(`  Total rows checked:      ${summary.total}`);
    console.log(`  Created / valid:         ${summary.created}`);
    console.log(`  Skipped (total):         ${getTotalSkipped(summary)}`);
    console.log(`  Failed:                  ${summary.failed}`);

    const skipLines = [...summary.skipByCategory.entries()]
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    if (skipLines.length === 0) {
        return;
    }

    console.log('\n[import:products] Skipped breakdown:');
    for (const [category, count] of skipLines) {
        console.log(`  Skipped (${category}): ${count}`);
    }
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    if (!options) {
        return;
    }

    const summary = await importProducts(options);

    printImportSummary(summary);

    if (summary.failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error('\n[import:products] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
