import { IsNotEmpty, IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, ValidateIf, IsIn, IsDateString, IsUUID, IsEnum, Max, Validate, ArrayUnique, MaxLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Import enums.
import { ReturnSellingInvoiceStatus } from '@libs/common/enums/invoiceStatus.enum';
import { ReturnReason } from '@libs/common/enums/returnReasons.enum';

// Import validators.
import { InvoiceDateRangeConstraint } from '@libs/common/validators/invoiceDateRange.constraint';

export class ReturnSellingInvoiceProductRequestDto {

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
        description: 'Additional notes for this return selling invoice product',
        example: 'Defective item',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'reasonNotes must be less than 2048 characters.' })
    reasonNotes?: string;
}

export class CreateReturnSellingInvoiceRequestDto {

    @ApiProperty({
        description: 'Original Selling Invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    sellingInvoiceId: string;

    @ApiProperty({
        description: 'List of products to return. Each productId must appear at most once.',
        type: [ReturnSellingInvoiceProductRequestDto],
        maxItems: 100,
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                returnQuantity: 10,
                reasonCategory: ReturnReason.DEFECTIVE,
                reasonNotes: 'Defective items',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(100, { message: 'products must contain at most 100 items.' })
    @ValidateNested({ each: true })
    @Type(() => ReturnSellingInvoiceProductRequestDto)
    @ArrayUnique((item: ReturnSellingInvoiceProductRequestDto) => item.productId, { message: 'Each productId must appear only once in the list.' })
    products: ReturnSellingInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this return selling invoice',
        example: 'Returning some defective items from sale',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'notes must be less than 2048 characters.' })
    notes?: string;
}

export class EditReturnSellingInvoiceRequestDto {
    @ApiProperty({
        description: 'Return selling invoice UUID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty()
    @IsUUID()
    id: string;

    @ApiProperty({
        description: 'List of products to return (replace existing ones). Each productId must appear at most once.',
        type: [ReturnSellingInvoiceProductRequestDto],
        maxItems: 100,
        example: [
            {
                productId: '550e8400-e29b-41d4-a716-446655440000',
                returnQuantity: 10,
                reasonCategory: ReturnReason.DEFECTIVE,
                reasonNotes: 'Defective items',
            }
        ],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayMaxSize(100, { message: 'products must contain at most 100 items.' })
    @ValidateNested({ each: true })
    @Type(() => ReturnSellingInvoiceProductRequestDto)
    @ArrayUnique((item: ReturnSellingInvoiceProductRequestDto) => item.productId, { message: 'Each productId must appear only once in the list.' })
    products: ReturnSellingInvoiceProductRequestDto[];

    @ApiPropertyOptional({
        description: 'Additional notes for this return selling invoice',
        example: 'Updated return contents',
        maxLength: 2048,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'notes must be less than 2048 characters.' })
    notes?: string;
}

export class GetListOfReturnSellingInvoiceRequestDto {
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
        enum: ['returnInvoiceId', 'sellingInvoiceId', 'userId', 'productId'],
    })
    @IsIn(['returnInvoiceId', 'sellingInvoiceId', 'userId', 'productId'])
    @ValidateIf((object) => object.search !== undefined || object.searchBy !== undefined)
    searchBy?: 'returnInvoiceId' | 'sellingInvoiceId' | 'userId' | 'productId';

    @ApiPropertyOptional({
        description: 'Sort by which field (return selling invoice table columns)',
        example: 'returnInvoiceId',
        enum: ['returnInvoiceId', 'sellingInvoiceId', 'totalProducts', 'totalQuantity', 'totalReturnPrice', 'status', 'draftAt', 'confirmedAt', 'createdAt'],
    })
    @IsIn(['returnInvoiceId', 'sellingInvoiceId', 'totalProducts', 'totalQuantity', 'totalReturnPrice', 'status', 'draftAt', 'confirmedAt', 'createdAt'])
    @IsOptional()
    sortBy?: 'returnInvoiceId' | 'sellingInvoiceId' | 'totalProducts' | 'totalQuantity' | 'totalReturnPrice' | 'status' | 'draftAt' | 'confirmedAt' | 'createdAt';

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
        example: ReturnSellingInvoiceStatus.CONFIRMED,
        enum: ReturnSellingInvoiceStatus,
    })
    @IsOptional()
    @IsEnum(ReturnSellingInvoiceStatus)
    status?: ReturnSellingInvoiceStatus;

    @ApiProperty({
        description:
            'Filter by return selling invoice createdAt from this instant (ISO 8601). Together with toDate, the range must not exceed 180 calendar days.',
        example: '2025-11-01T00:00:00.000Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    fromDate: string;

    @ApiProperty({
        description:
            'Filter by return selling invoice createdAt to this instant (ISO 8601). Together with fromDate, the range must not exceed 180 calendar days.',
        example: '2025-11-15T23:59:59.999Z',
        required: true,
    })
    @IsNotEmpty()
    @IsDateString()
    @Validate(InvoiceDateRangeConstraint, [180])
    toDate: string;
}

export class DeleteDraftReturnSellingInvoicesRequestDto {
    @ApiProperty({
        description: 'Draft return selling invoice UUIDs to delete',
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
