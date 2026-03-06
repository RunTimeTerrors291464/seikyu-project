import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, MaxLength, Min, MinLength, ValidateIf, IsIn, IsDateString, IsUUID, IsEnum, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { ImportInvoiceStatus } from '@app/common/enums/invoiceStatus.enum';

export class ImportInvoiceProductRequestDto {

    @ApiProperty({
        description: 'Product UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Product SKU',
        example: '1234567890123',
    })
    @IsNotEmpty()
    @IsString()
    productSku: string;

    @ApiProperty({
        description: 'Product name',
        example: 'Coca Cola 330ml',
    })
    @IsNotEmpty()
    @IsString()
    productName: string;

    @ApiProperty({
        description: 'Product unit',
        example: 'PCS',
    })
    @IsNotEmpty()
    @IsString()
    productUnit: string;

    @ApiProperty({
        description: 'Quantity to import',
        example: 100,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'quantity must be at least 1' })
    quantity: number;

    @ApiProperty({
        description: 'Import price per unit',
        example: 5000,
        minimum: 0,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0, { message: 'importPrice must be at least 0' })
    importPrice: number;

    @ApiPropertyOptional({
        description: 'Additional notes for this import invoice product',
        example: 'Import from supplier ABC - Batch #123',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class CreateImportInvoiceRequestDto {

    @ApiProperty({
        description: 'List of products to import',
        type: [ImportInvoiceProductRequestDto],
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                quantity: 100,
                importPrice: 5000.00,
                notes: 'This is a note for the import invoice product',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportInvoiceProductRequestDto)
    products: ImportInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this import invoice',
        example: 'Import from supplier ABC - Batch #123',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class EditImportInvoiceRequestDto {
    @ApiProperty({
        description: 'Import invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'List of products to import (replace existing ones)',
        type: [ImportInvoiceProductRequestDto],
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                productSku: '1234567890123',
                productName: 'Coca Cola 330ml',
                productUnit: 'PCS',
                quantity: 100,
                importPrice: 5000.00,
                notes: 'This is a note for the import invoice product',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportInvoiceProductRequestDto)
    products: ImportInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this import invoice',
        example: 'Updated import from supplier ABC - Batch #456',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class GetListOfImportInvoiceRequestDto {
    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(2147483647)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'The page size',
        example: 10,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'Product',
    })
    @IsString()
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The search by which field. invoiceId: Search by invoice ID. userId: Search by user ID (Must use the find UserID first).',
        example: 'invoiceId',
        enum: ['invoiceId', 'userId', 'productId'],
    })
    @IsIn(['invoiceId', 'userId', 'productId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'invoiceId' | 'userId' | 'productId';

    @ApiPropertyOptional({
        description: 'Sort by which field',
        example: 'invoiceId',
        enum: ['invoiceId', 'totalImportPrice', 'createdAt'],
    })
    @IsIn(['invoiceId', 'totalImportPrice', 'createdAt'])
    @IsOptional()
    sortBy?: 'invoiceId' | 'totalImportPrice' | 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'asc',
        enum: ['asc', 'desc'],
    })
    @IsIn(['asc', 'desc'])
    @IsOptional()
    sortOrder?: 'asc' | 'desc' = 'asc';

    @ApiPropertyOptional({
        description: 'Filter by status',
        example: ImportInvoiceStatus.CONFIRMED,
        enum: ImportInvoiceStatus,
    })
    @IsOptional()
    @IsEnum(ImportInvoiceStatus)
    status?: ImportInvoiceStatus;

    @ApiPropertyOptional({
        description: 'Filter import invoices from this date (ISO 8601 format)',
        example: '2025-11-01T00:00:00.000Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Filter import invoices to this date (ISO 8601 format)',
        example: '2025-11-15T23:59:59.999Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    toDate?: string;
}