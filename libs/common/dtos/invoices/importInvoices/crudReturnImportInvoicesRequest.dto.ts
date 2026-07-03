import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, ValidateIf, IsIn, IsDateString, IsUUID, IsEnum, Max, Validate, MaxLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { ReturnImportInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { ReturnReason } from '@libs/common/enums/returnReasons.enum';

// Import validators.
import { InvoiceDateRangeConstraint } from '@libs/common/validators/invoiceDateRange.constraint';

export class ReturnImportInvoiceProductRequestDto {

    @ApiProperty({
        description: 'Product UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Quantity to return',
        example: 10,
        minimum: 1,
        maximum: 2147483647,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1, { message: 'returnQuantity must be at least 1' })
    @Max(2147483647)
    returnQuantity: number;

    @ApiProperty({
        description: 'Reason category',
        example: ReturnReason.DEFECTIVE,
        enum: ReturnReason,
    })
    @IsNotEmpty()
    @IsEnum(ReturnReason)
    reasonCategory: ReturnReason;

    @ApiPropertyOptional({
        description: 'Additional notes for this return import invoice product',
        example: 'Defective item',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'reasonNotes must be less than 2048 characters.' })
    reasonNotes?: string;
}

export class CreateReturnImportInvoiceRequestDto {

    @ApiProperty({
        description: 'Original Import Invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    importInvoiceId: string;

    @ApiProperty({
        description: 'List of products to return. The same productId may appear multiple times; quantities are summed by productId.',
        type: [ReturnImportInvoiceProductRequestDto],
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                returnQuantity: 10,
                reasonCategory: ReturnReason.DEFECTIVE,
                reasonNotes: 'Defective items',
            },
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                returnQuantity: 5,
                reasonCategory: ReturnReason.OTHER,
                reasonNotes: 'Same product, additional returned quantity',
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReturnImportInvoiceProductRequestDto)
    products: ReturnImportInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this return import invoice',
        example: 'Returning some defective items from Batch #123',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'notes must be less than 2048 characters.' })
    notes?: string;
}

export class EditReturnImportInvoiceRequestDto {
    @ApiProperty({
        description: 'Return import invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'List of products to return (replace existing ones). The same productId may appear multiple times; quantities are summed by productId.',
        type: [ReturnImportInvoiceProductRequestDto],
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                returnQuantity: 10,
                reasonCategory: ReturnReason.DEFECTIVE,
                reasonNotes: 'Defective items',
            },
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                returnQuantity: 5,
                reasonCategory: ReturnReason.OTHER,
                reasonNotes: 'Same product, additional returned quantity',
            },
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReturnImportInvoiceProductRequestDto)
    products: ReturnImportInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this return import invoice',
        example: 'Updated return contents',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'notes must be less than 2048 characters.' })
    notes?: string;
}

export class GetListOfReturnImportInvoiceRequestDto {
    @ApiPropertyOptional({
        description: 'The page number',
        example: 1,
        minimum: 1,
        maximum: 2147483647,
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
        minimum: 1,
    })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'The search query',
        example: 'Product',
        maxLength: 255,
    })
    @IsString()
    @MaxLength(255, { message: 'search must be less than 255 characters.' })
    @ValidateIf((object) => object.searchBy !== undefined || object.search !== undefined)
    search?: string;

    @ApiPropertyOptional({
        description: 'The search by which field. productId accepts a product UUID or product SKU.',
        example: 'returnInvoiceId',
        enum: ['returnInvoiceId', 'importInvoiceId', 'userId', 'productId'],
    })
    @IsIn(['returnInvoiceId', 'importInvoiceId', 'userId', 'productId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'returnInvoiceId' | 'importInvoiceId' | 'userId' | 'productId';

    @ApiPropertyOptional({
        description: 'Sort by which field (return import invoice table columns)',
        example: 'returnInvoiceId',
        enum: ['returnInvoiceId', 'importInvoiceId', 'totalProducts', 'totalQuantity', 'totalReturnPrice', 'status', 'draftAt', 'confirmedAt', 'createdAt'],
    })
    @IsIn(['returnInvoiceId', 'importInvoiceId', 'totalProducts', 'totalQuantity', 'totalReturnPrice', 'status', 'draftAt', 'confirmedAt', 'createdAt'])
    @IsOptional()
    sortBy?: 'returnInvoiceId' | 'importInvoiceId' | 'totalProducts' | 'totalQuantity' | 'totalReturnPrice' | 'status' | 'draftAt' | 'confirmedAt' | 'createdAt';

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
        example: ReturnImportInvoiceStatus.CONFIRMED,
        enum: ReturnImportInvoiceStatus,
    })
    @IsOptional()
    @IsEnum(ReturnImportInvoiceStatus)
    status?: ReturnImportInvoiceStatus;

    @ApiProperty({
        description:
            'Filter by return import invoice createdAt from this instant (ISO 8601). Together with toDate, the range must not exceed 180 calendar days.',
        example: '2025-11-01T00:00:00.000Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    fromDate: string;

    @ApiProperty({
        description:
            'Filter by return import invoice createdAt to this instant (ISO 8601). Together with fromDate, the range must not exceed 180 calendar days.',
        example: '2025-11-15T23:59:59.999Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    @Validate(InvoiceDateRangeConstraint, [180])
    toDate: string;
}

export class DeleteDraftReturnImportInvoicesRequestDto {
    @ApiProperty({
        description: 'Draft return import invoice UUIDs to delete',
        type: [String],
        maxItems: 100,
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(100, { message: 'ids must contain at most 100 items.' })
    @IsUUID('4', { each: true })
    ids: string[];
}
